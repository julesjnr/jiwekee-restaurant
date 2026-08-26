import net from 'node:net';

export async function getAvailablePort(startPort = 3000, host = '0.0.0.0') {
  const probe = (port) =>
    new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });

      server.listen(port, host);
    });

  let port = Number(startPort) || 3000;

  while (port < 65535) {
    const isFree = await probe(port);
    if (isFree) return port;
    port += 1;
  }

  throw new Error('No available ports found in range 3000-65535');
}
