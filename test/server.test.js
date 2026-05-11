import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createAppServer } from '../src/server.js';

let server;
let baseUrl;

before(async () => {
  server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('health endpoint returns deployment metadata', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.app, 'docker-cicd-vps-demo');
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.uptimeSeconds, 'number');
});

test('homepage is served', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Docker CI\/CD VPS Demo/);
});
