import 'dotenv/config';
console.log('DATABASE_URL typeof:', typeof process.env.DATABASE_URL);
console.log('DATABASE_URL value:', JSON.stringify(process.env.DATABASE_URL));

try {
  const url = new URL(process.env.DATABASE_URL);
  console.log('Parsed URL:', {
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
  });
} catch (err) {
  console.error('URL parse error:', err.message);
}
