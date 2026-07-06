const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`[Package-Deploy] ${msg}`);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  log(`Root directory: ${rootDir}`);

  // 1. Run build
  log('Running build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Package Next.js Frontend
  log('Packaging Next.js Web App...');
  const webStandalone = path.join(rootDir, 'apps', 'web', '.next', 'standalone');
  const webAppDir = path.join(webStandalone, 'apps', 'web');

  // Copy public and static
  const publicSrc = path.join(rootDir, 'apps', 'web', 'public');
  const publicDest = path.join(webAppDir, 'public');
  if (fs.existsSync(publicSrc)) {
    log('Copying public folder...');
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  const staticSrc = path.join(rootDir, 'apps', 'web', '.next', 'static');
  const staticDest = path.join(webAppDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    log('Copying static files...');
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  // Create zip for web
  const webZip = path.join(rootDir, 'web-deploy.zip');
  if (fs.existsSync(webZip)) {
    fs.unlinkSync(webZip);
  }
  log(`Creating zip file: ${webZip}`);
  execSync(`powershell -Command "Compress-Archive -Path '${webStandalone}\\*' -DestinationPath '${webZip}' -Force"`);

  // 3. Package NestJS API
  log('Packaging NestJS API...');
  const apiDeployDir = path.join(rootDir, 'api-deploy');
  if (fs.existsSync(apiDeployDir)) {
    fs.rmSync(apiDeployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(apiDeployDir);
  fs.mkdirSync(path.join(apiDeployDir, 'prisma'));

  // Copy dist
  fs.cpSync(path.join(rootDir, 'apps', 'api', 'dist'), path.join(apiDeployDir, 'dist'), { recursive: true });

  // Copy schema
  fs.cpSync(path.join(rootDir, 'packages', 'database', 'prisma', 'schema.prisma'), path.join(apiDeployDir, 'prisma', 'schema.prisma'));

  // Create package.json for production NestJS API deployment
  const apiPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'apps', 'api', 'package.json'), 'utf8'));
  
  // Modify scripts for simple production run
  apiPkg.scripts = {
    "start": "node dist/main.js",
    "postinstall": "npx prisma generate --schema prisma/schema.prisma"
  };
  // Ensure development packages are not needed
  delete apiPkg.devDependencies;

  // Add prisma as dependency if not present to ensure cli is available for generate
  if (!apiPkg.dependencies['prisma']) {
    apiPkg.dependencies['prisma'] = '^6.10.1';
  }

  fs.writeFileSync(path.join(apiDeployDir, 'package.json'), JSON.stringify(apiPkg, null, 2));

  // Create zip for api
  const apiZip = path.join(rootDir, 'api-deploy.zip');
  if (fs.existsSync(apiZip)) {
    fs.unlinkSync(apiZip);
  }
  log(`Creating zip file: ${apiZip}`);
  execSync(`powershell -Command "Compress-Archive -Path '${apiDeployDir}\\*' -DestinationPath '${apiZip}' -Force"`);

  // Clean up api-deploy temp dir
  fs.rmSync(apiDeployDir, { recursive: true, force: true });

  log('All packages built and compressed successfully!');
  log('Output files:');
  log(`- ${webZip}`);
  log(`- ${apiZip}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
