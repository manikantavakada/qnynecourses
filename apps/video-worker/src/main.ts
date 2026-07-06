import 'dotenv/config';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Worker } from 'bullmq';
import { execa } from 'execa';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

type JobPayload = { videoId: string; courseId: string; sourceKey: string };

const prisma = new PrismaClient();
const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function uploadDirectory(localDir: string, prefix: string) {
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const relative = fullPath.slice(localDir.length + 1).replace(/\\/g, '/');
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: `${prefix}/${relative}`,
          Body: await readFile(fullPath),
          ContentType: relative.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
        }),
      );
    }
  }
  await walk(localDir);
}

new Worker<JobPayload>(
  'video-transcode',
  async (job) => {
    const { videoId, courseId, sourceKey } = job.data;
    const workDir = join(tmpdir(), `qnyne-${videoId}`);
    const sourcePath = join(workDir, 'source.mp4');
    const outputDir = join(workDir, 'hls');
    await rm(workDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });
    await prisma.videoProcessingJob.update({ where: { videoId }, data: { status: 'PROCESSING', progress: 5, startedAt: new Date() } });

    try {
      const source = await s3.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: sourceKey }));
      await writeFile(sourcePath, await streamToBuffer(source.Body));
      await prisma.videoProcessingJob.update({ where: { videoId }, data: { progress: 20 } });
      await execa('ffmpeg', [
        '-y',
        '-i',
        sourcePath,
        '-filter_complex',
        '[0:v]split=3[v1][v2][v3];[v1]scale=w=640:h=-2[v1out];[v2]scale=w=1280:h=-2[v2out];[v3]scale=w=1920:h=-2[v3out]',
        '-map',
        '[v1out]',
        '-map',
        '0:a?',
        '-map',
        '[v2out]',
        '-map',
        '0:a?',
        '-map',
        '[v3out]',
        '-map',
        '0:a?',
        '-c:v',
        'h264',
        '-crf',
        '22',
        '-c:a',
        'aac',
        '-f',
        'hls',
        '-hls_time',
        '6',
        '-hls_playlist_type',
        'vod',
        '-master_pl_name',
        'master.m3u8',
        '-var_stream_map',
        'v:0,a:0,name:360p v:1,a:1,name:720p v:2,a:2,name:1080p',
        join(outputDir, '%v', 'index.m3u8'),
      ]);
      await prisma.videoProcessingJob.update({ where: { videoId }, data: { progress: 80 } });
      const prefix = `courses/${courseId}/${videoId}`;
      await uploadDirectory(outputDir, prefix);
      await prisma.$transaction([
        prisma.courseVideo.update({ where: { id: videoId }, data: { status: 'READY', hlsMasterKey: `${prefix}/master.m3u8` } }),
        prisma.videoProcessingJob.update({ where: { videoId }, data: { status: 'READY', progress: 100, completedAt: new Date() } }),
      ]);
    } catch (error) {
      await prisma.$transaction([
        prisma.courseVideo.update({ where: { id: videoId }, data: { status: 'FAILED' } }),
        prisma.videoProcessingJob.update({
          where: { videoId },
          data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'Unknown transcode error' },
        }),
      ]);
      throw error;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  },
  { connection: redis as any },
);

new Worker<{ orderId: string; paymentId: string }>(
  'email',
  async (job) => {
    const order = await prisma.order.findUnique({
      where: { id: job.data.orderId },
      include: { user: true, course: true, payment: true },
    });
    if (!order?.payment) throw new Error('Receipt job could not find paid order');
    const invoiceNumber = `QNYNE-${order.createdAt.getFullYear()}-${order.id.slice(-8).toUpperCase()}`;
    const invoiceHtml = [
      '<!doctype html><html><body>',
      `<h1>Tax Invoice ${invoiceNumber}</h1>`,
      `<p>Customer: ${order.user.name} (${order.user.email})</p>`,
      `<p>Course: ${order.course.title}</p>`,
      `<p>Amount: INR ${(order.amount / 100).toFixed(2)}</p>`,
      `<p>Status: ${order.payment.status}</p>`,
      '</body></html>',
    ].join('');
    const key = `invoices/${order.id}.html`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: invoiceHtml,
        ContentType: 'text/html; charset=utf-8',
      }),
    );
    await prisma.payment.update({ where: { id: order.payment.id }, data: { invoiceUrl: key } });
  },
  { connection: redis as any },
);

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
