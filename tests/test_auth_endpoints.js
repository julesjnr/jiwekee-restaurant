import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { pool } from '../server/src/db/pool.js';
import authRoutes from '../server/src/routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

const server = app.listen(4501, async () => {
  console.log('Testing Auth Controller & Routes on port 4501...');

  try {
    // 1. Missing fields login
    const missingRes = await fetch('http://localhost:4501/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });
    console.log('1. Empty login status:', missingRes.status, '(expected 400)');
    if (missingRes.status !== 400) throw new Error('Expected 400 for empty login');

    // 2. Invalid credentials login
    const badRes = await fetch('http://localhost:4501/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'wrong' }),
    });
    console.log('2. Bad credentials status:', badRes.status, '(expected 401)');
    if (badRes.status !== 401) throw new Error('Expected 401 for bad login');

    // 3. Valid customer login
    const goodRes = await fetch('http://localhost:4501/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@jiwekee.com', password: 'password123' }),
    });
    const goodData = await goodRes.json();
    console.log('3. Valid login status:', goodRes.status, 'user:', goodData.user?.name, 'role:', goodData.user?.role, 'token length:', goodData.token?.length);
    if (!goodData.token) throw new Error('Expected JWT token');

    // 4. Register new user
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await fetch('http://localhost:4501/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123',
        loyalty: true,
      }),
    });
    const regData = await regRes.json();
    console.log('4. Register status:', regRes.status, 'registered user:', regData.user?.email, 'points:', regData.user?.loyalty_points);
    if (regRes.status !== 201) throw new Error('Expected 201 for register');

    // 5. Test forgot-password
    const forgotRes = await fetch('http://localhost:4501/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    console.log('5. Forgot password status:', forgotRes.status, 'token returned:', Boolean(forgotData.token));
    if (!forgotData.token) throw new Error('Expected reset token');

    // 6. Test verify reset token
    const verifyRes = await fetch(`http://localhost:4501/api/auth/verify-reset-token/${forgotData.token}`);
    const verifyData = await verifyRes.json();
    console.log('6. Verify token valid:', verifyData.valid, 'email:', verifyData.email);
    if (!verifyData.valid) throw new Error('Expected valid token');

    // 7. Test reset-password
    const resetRes = await fetch('http://localhost:4501/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotData.token,
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      }),
    });
    const resetData = await resetRes.json();
    console.log('7. Reset password status:', resetRes.status, 'message:', resetData.message);

    // 8. Test logging in with new password
    const newLoginRes = await fetch('http://localhost:4501/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'newpassword123' }),
    });
    const newLoginData = await newLoginRes.json();
    console.log('8. Login with new password:', newLoginRes.status, 'user:', newLoginData.user?.name);
    if (newLoginRes.status !== 200) throw new Error('Expected login with new password to succeed');

    console.log('\n🚀 ALL AUTH CONTROLLER & ROUTE ENDPOINT TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('Auth test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
    process.exit(process.exitCode || 0);
  }
});
