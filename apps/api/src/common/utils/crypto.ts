import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function hmacSha256(input: string, secret: string) {
  return createHmac('sha256', secret).update(input).digest('hex');
}

export function timingSafeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
