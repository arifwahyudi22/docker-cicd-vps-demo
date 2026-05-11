import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { hostname } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = normalize(join(__dirname, '..', 'public'));

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function jsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(body, null, 2));
}

function deploymentMetadata() {
  return {
    app: 'docker-cicd-vps-demo',
    status: 'ok',
    version: process.env.APP_VERSION || 'local',
    commit: process.env.COMMIT_SHA || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    host: hostname(),
    uptimeSeconds: Math.round(process.uptime())
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(join(publicDir, pathname));

  if (!safePath.startsWith(publicDir)) {
    jsonResponse(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const file = await readFile(safePath);
    res.writeHead(200, {
      'content-type': contentTypes[extname(safePath)] || 'application/octet-stream',
      'cache-control': pathname === '/index.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(file);
  } catch {
    jsonResponse(res, 404, { error: 'Not found' });
  }
}

export function createAppServer() {
  return createServer(async (req, res) => {
    if (req.method !== 'GET') {
      jsonResponse(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (req.url === '/health') {
      jsonResponse(res, 200, deploymentMetadata());
      return;
    }

    if (req.url === '/ready') {
      jsonResponse(res, 200, { ready: true });
      return;
    }

    await serveStatic(req, res);
  });
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const server = createAppServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`docker-cicd-vps-demo listening on port ${port}`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
