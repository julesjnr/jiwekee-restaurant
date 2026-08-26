import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { pool } from '../server/src/db/pool.js';
import authRoutes from '../server/src/routes/authRoutes.js';
import {
  verifyTransporter,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
} from '../server/src/services/emailService.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

const server = app.listen(4502, async () => {
  console.log('Testing Email Service on port 4502...\n');

  try {
    // 1. Verify Transporter
    const verifyStatus = await verifyTransporter();
    console.log('1. Transporter Verification:', verifyStatus);

    // 2. Test Welcome Email
    const welcomeResult = await sendWelcomeEmail({
      email: 'customer@example.com',
      name: 'Sarah Mwangi',
      loyaltyPoints: 50,
      walletBalance: 0,
    });
    console.log('2. Welcome Email Sent:', welcomeResult.ok, 'ID:', welcomeResult.messageId);
    if (!welcomeResult.ok) throw new Error('Failed to send welcome email');

    // 3. Test Password Reset Email
    const resetResult = await sendPasswordResetEmail({
      email: 'customer@example.com',
      name: 'Sarah Mwangi',
      resetUrl: 'http://localhost:3000/reset-password/test-token-abcdef',
      resetToken: 'test-token-abcdef',
    });
    console.log('3. Password Reset Email Sent:', resetResult.ok, 'ID:', resetResult.messageId);
    if (!resetResult.ok) throw new Error('Failed to send password reset email');

    // 4. Test Order Confirmation Email
    const orderResult = await sendOrderConfirmationEmail({
      email: 'customer@example.com',
      name: 'Sarah Mwangi',
      order: {
        id: 204,
        amount: 3200.0,
        status: 'Paid',
        payment_method: 'wallet',
        order_type: 'Dine-In',
        table_number: 'T-06',
        points_earned: 32,
        notes: 'Extra chilli sauce on the side please',
        items: [
          { name: 'Mbuzi Choma Platter (1kg)', quantity: 1, unit_price: 1800 },
          { name: 'Ugali & Sukuma Wiki', quantity: 2, unit_price: 250 },
          { name: 'Tusker Cider / Soft Drink', quantity: 3, unit_price: 300 },
        ],
      },
    });
    console.log('4. Order Confirmation Email Sent:', orderResult.ok, 'ID:', orderResult.messageId);
    if (!orderResult.ok) throw new Error('Failed to send order confirmation email');

    // 5. Test Booking Confirmation Email
    const bookingResult = await sendBookingConfirmationEmail({
      email: 'customer@example.com',
      name: 'Sarah Mwangi',
      reservation: {
        id: 78,
        customer_name: 'Sarah Mwangi',
        reservation_date: '2026-09-02',
        reservation_time: '20:00',
        guests_count: 6,
        table_number: 'T-12 (Garden Terrace)',
        status: 'Confirmed',
        special_requests: 'Birthday celebration with custom dessert candle',
      },
    });
    console.log('5. Booking Confirmation Email Sent:', bookingResult.ok, 'ID:', bookingResult.messageId);
    if (!bookingResult.ok) throw new Error('Failed to send booking confirmation email');

    // 6. Test Payment Receipt Email
    const receiptResult = await sendPaymentReceiptEmail({
      email: 'customer@example.com',
      name: 'Sarah Mwangi',
      order: {
        id: 204,
        amount: 3200.0,
        payment_method: 'mpesa',
        mpesa_receipt: 'RTM65890PQ',
        items: [
          { name: 'Mbuzi Choma Platter (1kg)', quantity: 1, unit_price: 1800 },
          { name: 'Ugali & Sukuma Wiki', quantity: 2, unit_price: 250 },
          { name: 'Tusker Cider / Soft Drink', quantity: 3, unit_price: 300 },
        ],
      },
      payment: {
        transaction_id: 'RTM65890PQ',
        amount: 3200.0,
        payment_method: 'mpesa',
      },
    });
    console.log('6. Payment Receipt Email Sent:', receiptResult.ok, 'ID:', receiptResult.messageId);
    if (!receiptResult.ok) throw new Error('Failed to send payment receipt email');

    // 7. Test API route dispatch
    const apiRes = await fetch('http://localhost:4502/api/auth/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'receipt', email: 'test@jiwekee.com', name: 'James Doe' }),
    });
    const apiData = await apiRes.json();
    console.log('7. API Route /api/auth/test-email Status:', apiRes.status, 'Response:', apiData.ok);
    if (!apiData.ok) throw new Error('API test email route failed');

    console.log('\n🎉 ALL 5 EMAIL NOTIFICATION TYPES & API ROUTES TESTED AND VERIFIED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('Email test suite failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
    process.exit(process.exitCode || 0);
  }
});
