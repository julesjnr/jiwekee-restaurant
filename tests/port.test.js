import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';

import { getAvailablePort } from '../server/port.js';

test('getAvailablePort skips occupied ports', async () => {
  const occupied = await new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ port, server });
    });
  });

  const candidate = await getAvailablePort(occupied.port);

  assert.notEqual(candidate, occupied.port);

  await new Promise((resolve, reject) => {
    occupied.server.close((err) => (err ? reject(err) : resolve()));
  });
});
