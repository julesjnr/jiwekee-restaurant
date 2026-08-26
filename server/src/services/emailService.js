import nodemailer from "nodemailer";

// Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  (SMTP_USER ? `"Jiwekee Tavern & Grill" <${SMTP_USER}>` : '"Jiwekee Tavern & Grill" <noreply@jiwekee.com>');
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

let transporterInstance = null;

/**
 * Creates or returns the singleton nodemailer transporter.
 */
export function getTransporter() {
  if (transporterInstance) return transporterInstance;

  const isConfigured = Boolean(SMTP_USER && SMTP_PASS);

  if (isConfigured) {
    transporterInstance = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Development fallback: creates a simulated stream transporter that logs emails
    transporterInstance = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporterInstance;
}

/**
 * Verifies the transporter connection status.
 */
export async function verifyTransporter() {
  try {
    const transporter = getTransporter();
    if (SMTP_USER && SMTP_PASS) {
      await transporter.verify();
      console.log(`[Email Service] ✓ Connected to SMTP server at ${SMTP_HOST}:${SMTP_PORT} (${SMTP_USER})`);
      return { ok: true, mode: "live", host: SMTP_HOST };
    } else {
      console.log("[Email Service] ℹ SMTP credentials not set. Running in development simulation mode.");
      return { ok: true, mode: "simulation", message: "Set SMTP_USER & SMTP_PASS in .env for real delivery" };
    }
  } catch (err) {
    console.error("[Email Service Error] SMTP Verification failed:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Helper to wrap email content inside standard Jiwekee luxury HTML layout.
 */
function wrapHtmlLayout({ title, previewText, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Jiwekee Tavern & Grill"}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F4EE;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1D1916;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8F4EE;
      padding: 30px 0 50px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 43, 0.08);
      border: 1px solid #E8DFD5;
    }
    .email-header {
      background: linear-gradient(135deg, #0F172B 0%, #1A2438 100%);
      padding: 32px 30px;
      text-align: center;
      border-bottom: 3px solid #D4A74A;
    }
    .header-logo {
      display: inline-block;
      width: 50px;
      height: 50px;
      line-height: 50px;
      border-radius: 50%;
      background: rgba(212, 167, 74, 0.2);
      border: 1.5px solid #D4A74A;
      font-size: 24px;
      margin-bottom: 12px;
    }
    .header-title {
      font-family: Georgia, 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header-tagline {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #D4A74A;
      margin-top: 6px;
    }
    .email-body {
      padding: 36px 32px;
      line-height: 1.6;
      font-size: 15px;
      color: #333333;
    }
    .btn-action {
      display: inline-block;
      background: linear-gradient(135deg, #D4A74A 0%, #B8860B 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      text-align: center;
      margin: 24px 0;
      box-shadow: 0 4px 14px rgba(212, 167, 74, 0.35);
    }
    .info-card {
      background: #F8F4EE;
      border-left: 4px solid #D4A74A;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 14px;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .item-table th {
      background: #0F172B;
      color: #FFFFFF;
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      font-size: 12.5px;
    }
    .item-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #E8DFD5;
      color: #444444;
    }
    .item-table tr:nth-child(even) td {
      background: #FAF8F5;
    }
    .total-row td {
      font-weight: 700;
      font-size: 15px;
      color: #0F172B;
      border-top: 2px solid #D4A74A;
      border-bottom: none;
    }
    .email-footer {
      background: #F2ECE3;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #756D66;
      border-top: 1px solid #E8DFD5;
      line-height: 1.5;
    }
    .footer-links a {
      color: #D4A74A;
      text-decoration: none;
      margin: 0 8px;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .email-body {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display: none; font-size: 1px; color: #F8F4EE; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText || title || "Jiwekee Tavern & Grill Update"}
  </div>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <div class="email-container">
          <!-- Header -->
          <div class="email-header">
            <div class="header-logo">🍽️</div>
            <h1 class="header-title">Jiwekee</h1>
            <div class="header-tagline">Tavern & Grill • Authentic Dining</div>
          </div>

          <!-- Body Content -->
          <div class="email-body">
            ${bodyContent}
          </div>

          <!-- Footer -->
          <div class="email-footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #0F172B;">
              Jiwekee Tavern & Grill • Nairobi, Kenya
            </p>
            <p style="margin: 0 0 12px 0;">
              Exquisite African cuisine, grilled delicacies, and premier hospitality.
            </p>
            <div class="footer-links">
              <a href="${CLIENT_ORIGIN}/menu">Explore Menu</a> • 
              <a href="${CLIENT_ORIGIN}/reservations">Book Table</a> • 
              <a href="${CLIENT_ORIGIN}/dashboard">My Loyalty Profile</a>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #9E958D;">
              © ${new Date().getFullYear()} Jiwekee Restaurant. All rights reserved.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Base sender helper.
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (info.message) {
      // In simulation mode, info.message contains the email stream buffer
      console.log(`[Email Simulation] Sent "${subject}" to ${to}`);
    } else {
      console.log(`[Email Service] ✓ Email delivered to ${to} (MessageId: ${info.messageId})`);
    }

    return { ok: true, messageId: info.messageId || "simulated-id" };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * 1. PASSWORD RESET EMAIL
 */
export async function sendPasswordResetEmail({ email, name, resetUrl, resetToken }) {
  const fallbackUrl = resetUrl || `${CLIENT_ORIGIN}/reset-password/${resetToken}`;
  const subject = "🔐 Password Reset Request — Jiwekee Restaurant";
  const previewText = "Follow the link inside to safely reset your Jiwekee dining password.";

  const bodyContent = `
    <h2 style="color: #0F172B; font-size: 22px; margin-top: 0;">Password Reset Request</h2>
    <p>Hello <strong>${name || "Valued Guest"}</strong>,</p>
    <p>We received a request to reset the password associated with your Jiwekee dining and loyalty account (<strong>${email}</strong>).</p>
    <p>Click the button below to choose a new password. This link is secure and valid for <strong>1 hour</strong>.</p>
    
    <div style="text-align: center;">
      <a href="${fallbackUrl}" class="btn-action" target="_blank">Reset My Password →</a>
    </div>

    <div class="info-card">
      <strong>Didn't request this?</strong><br/>
      If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged and your account is secure.
    </div>

    <p style="font-size: 12.5px; color: #756D66; word-break: break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${fallbackUrl}" style="color: #D4A74A;">${fallbackUrl}</a>
    </p>
  `;

  const text = `Hello ${name || "Valued Guest"},\n\nWe received a request to reset your Jiwekee password.\n\nPlease visit the link below to set a new password:\n${fallbackUrl}\n\nThis link expires in 1 hour.\nIf you did not request this, please ignore this email.`;

  return sendEmail({
    to: email,
    subject,
    html: wrapHtmlLayout({ title: subject, previewText, bodyContent }),
    text,
  });
}

/**
 * 2. WELCOME EMAIL FOR NEW USERS
 */
export async function sendWelcomeEmail({ email, name, loyaltyPoints = 50, walletBalance = 0 }) {
  const subject = "🎉 Welcome to Jiwekee Tavern & Grill — Your Culinary Journey Begins!";
  const previewText = "Welcome to Jiwekee! Enjoy 50 complimentary Bronze loyalty points on us.";

  const bodyContent = `
    <h2 style="color: #0F172B; font-size: 22px; margin-top: 0;">Welcome to the Jiwekee Family!</h2>
    <p>Hello <strong>${name || "Valued Guest"}</strong>,</p>
    <p>Thank you for creating an account with <strong>Jiwekee Tavern & Grill</strong>. We are thrilled to welcome you to our authentic African dining and loyalty club!</p>
    
    <div class="info-card">
      <h3 style="margin: 0 0 8px 0; color: #0F172B; font-size: 16px;">✨ Your Member Privileges:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #444;">
        <li><strong>Loyalty Bonus:</strong> <span style="color: #D4A74A; font-weight: 700;">${loyaltyPoints} Points</span> awarded to your profile</li>
        <li><strong>Tier Status:</strong> Bronze VIP Member</li>
        <li><strong>Starting Digital Wallet:</strong> KES ${Number(walletBalance).toFixed(2)}</li>
        <li>Instant Table Reservations & Seamless M-Pesa Ordering</li>
      </ul>
    </div>

    <p>Explore our flame-grilled nyama choma, coastal biryani, signature platters, and authentic dishes prepared with love by our master chefs.</p>

    <div style="text-align: center;">
      <a href="${CLIENT_ORIGIN}/menu" class="btn-action" target="_blank">Explore Menu & Order Now →</a>
    </div>

    <p>We look forward to serving you an extraordinary culinary experience soon!</p>
  `;

  const text = `Welcome to Jiwekee Tavern & Grill, ${name || "Valued Guest"}!\n\nYour dining account has been successfully created with ${loyaltyPoints} loyalty points.\n\nExplore our menu at ${CLIENT_ORIGIN}/menu and reserve tables at ${CLIENT_ORIGIN}/reservations.\n\nJiwekee Tavern & Grill, Nairobi.`;

  return sendEmail({
    to: email,
    subject,
    html: wrapHtmlLayout({ title: subject, previewText, bodyContent }),
    text,
  });
}

/**
 * 3. ORDER CONFIRMATION EMAIL
 */
export async function sendOrderConfirmationEmail({ email, name, order }) {
  const items = order.items || [];
  const orderId = order.id || "N/A";
  const amount = Number(order.amount || 0).toFixed(2);
  const paymentMethod = (order.payment_method || "mpesa").toUpperCase();
  const orderType = order.order_type || "Dine-In";
  const status = order.status || "Confirmed";
  const tableOrAddress = order.table_number ? `Table #${order.table_number}` : (order.delivery_address || "Dine-In");

  const subject = `🍽️ Order Confirmed #${orderId} — Jiwekee Tavern & Grill`;
  const previewText = `Your order #${orderId} for KES ${amount} is confirmed and queued with our kitchen.`;

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td><strong>${item.name}</strong>${item.special_instructions ? `<br/><small style="color:#888;">Note: ${item.special_instructions}</small>` : ""}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">KES ${Number(item.unit_price).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">KES ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const bodyContent = `
    <h2 style="color: #0F172B; font-size: 22px; margin-top: 0;">Order Received & Confirmed!</h2>
    <p>Hello <strong>${name || "Valued Guest"}</strong>,</p>
    <p>Thank you for ordering with Jiwekee! Your order has been placed and sent to our executive kitchen.</p>

    <div class="info-card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span><strong>Order ID:</strong> #${orderId}</span>
        <span><strong>Status:</strong> <span style="color: #3F7D58; font-weight: 700;">${status}</span></span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span><strong>Service:</strong> ${orderType} (${tableOrAddress})</span>
        <span><strong>Payment:</strong> ${paymentMethod}</span>
      </div>
      ${order.points_earned ? `<div><strong>Points Earned:</strong> <span style="color: #D4A74A; font-weight: 700;">+${order.points_earned} Points</span></div>` : ""}
    </div>

    <h3 style="color: #0F172B; font-size: 16px; margin: 24px 0 10px;">Itemized Order Summary:</h3>
    <table class="item-table">
      <thead>
        <tr>
          <th>Dish / Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Grand Total:</td>
          <td style="text-align: right; color: #D4A74A;">KES ${amount}</td>
        </tr>
      </tbody>
    </table>

    ${order.notes ? `<p style="font-size: 13.5px; background: #FAF8F5; padding: 10px; border-radius: 6px;"><strong>Chef Note:</strong> ${order.notes}</p>` : ""}

    <div style="text-align: center;">
      <a href="${CLIENT_ORIGIN}/dashboard" class="btn-action" target="_blank">Track Order in Live Dashboard →</a>
    </div>
  `;

  const text = `Order #${orderId} Confirmed!\n\nHello ${name || "Valued Guest"},\nThank you for ordering with Jiwekee.\n\nTotal: KES ${amount}\nPayment: ${paymentMethod}\nType: ${orderType} (${tableOrAddress})\n\nTrack order at ${CLIENT_ORIGIN}/dashboard`;

  return sendEmail({
    to: email,
    subject,
    html: wrapHtmlLayout({ title: subject, previewText, bodyContent }),
    text,
  });
}

/**
 * 4. BOOKING / RESERVATION CONFIRMATION EMAIL
 */
export async function sendBookingConfirmationEmail({ email, name, reservation }) {
  const resId = reservation.id || "N/A";
  const resDate = reservation.reservation_date || "Upcoming";
  const resTime = reservation.reservation_time || "TBD";
  const guests = reservation.guests_count || reservation.guest_count || 2;
  const table = reservation.table_number ? `Table #${reservation.table_number}` : "Main Dining Hall";
  const status = reservation.status || "Confirmed";

  const subject = `📅 Table Reservation Confirmed #${resId} — Jiwekee Restaurant`;
  const previewText = `Your table for ${guests} guests on ${resDate} at ${resTime} is reserved at Jiwekee.`;

  const bodyContent = `
    <h2 style="color: #0F172B; font-size: 22px; margin-top: 0;">Table Reservation Confirmed!</h2>
    <p>Hello <strong>${name || reservation.customer_name || "Valued Guest"}</strong>,</p>
    <p>We are delighted to confirm your upcoming table reservation at <strong>Jiwekee Tavern & Grill</strong>. Our floor team is preparing a wonderful table for your dining party.</p>

    <div class="info-card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Reservation Reference:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right;">#RES-${resId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Date:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right;">${resDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Seating Time:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right;">${resTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Number of Guests:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right;">${guests} Guests</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Assigned Seating:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #D4A74A; text-align: right;">${table}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #756D66;">Status:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #3F7D58; text-align: right;">${status}</td>
        </tr>
      </table>
    </div>

    ${reservation.special_requests ? `<p style="font-size: 13px; background: #FAF8F5; padding: 10px; border-radius: 6px;"><strong>Special Requests:</strong> ${reservation.special_requests}</p>` : ""}

    <p style="font-size: 13.5px; color: #555;">
      <strong>Dining Notes:</strong> Please inform our host if you anticipate arriving later than 15 minutes past your reserved time. Valet parking and accessible seating are available on premises.
    </p>

    <div style="text-align: center;">
      <a href="${CLIENT_ORIGIN}/reservations" class="btn-action" target="_blank">Manage My Bookings →</a>
    </div>
  `;

  const text = `Reservation Confirmed #${resId}\n\nHello ${name || reservation.customer_name},\nYour table for ${guests} guests on ${resDate} at ${resTime} (${table}) is confirmed.\n\nManage bookings at ${CLIENT_ORIGIN}/reservations`;

  return sendEmail({
    to: email,
    subject,
    html: wrapHtmlLayout({ title: subject, previewText, bodyContent }),
    text,
  });
}

/**
 * 5. INVOICE / RECEIPT EMAIL
 */
export async function sendPaymentReceiptEmail({ email, name, order, payment }) {
  const orderId = order.id || "N/A";
  const amount = Number(payment?.amount || order.amount || 0).toFixed(2);
  const txnId = payment?.transaction_id || order.mpesa_receipt || `TXN-${orderId}`;
  const method = (payment?.payment_method || order.payment_method || "mpesa").toUpperCase();
  const dateStr = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `🧾 Official Payment Receipt #${txnId} — Jiwekee Restaurant`;
  const previewText = `Official payment receipt for your Jiwekee order #${orderId} (KES ${amount}).`;

  const items = order.items || [];
  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">KES ${Number(item.unit_price).toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">KES ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const bodyContent = `
    <h2 style="color: #0F172B; font-size: 22px; margin-top: 0;">Payment Receipt & Tax Invoice</h2>
    <p>Hello <strong>${name || "Valued Guest"}</strong>,</p>
    <p>Thank you for your payment. Here is your official dining receipt from Jiwekee Tavern & Grill.</p>

    <div class="info-card" style="border-left-color: #3F7D58;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
        <tr>
          <td style="color: #756D66; padding: 4px 0;">Transaction Code:</td>
          <td style="font-weight: 700; text-align: right; font-family: monospace; font-size: 14px;">${txnId}</td>
        </tr>
        <tr>
          <td style="color: #756D66; padding: 4px 0;">Order Reference:</td>
          <td style="font-weight: 700; text-align: right;">Order #${orderId}</td>
        </tr>
        <tr>
          <td style="color: #756D66; padding: 4px 0;">Payment Method:</td>
          <td style="font-weight: 700; text-align: right;">${method}</td>
        </tr>
        <tr>
          <td style="color: #756D66; padding: 4px 0;">Timestamp:</td>
          <td style="font-weight: 700; text-align: right;">${dateStr}</td>
        </tr>
        <tr>
          <td style="color: #756D66; padding: 4px 0;">Payment Status:</td>
          <td style="font-weight: 700; color: #3F7D58; text-align: right;">PAID / SETTLED</td>
        </tr>
      </table>
    </div>

    <table class="item-table">
      <thead>
        <tr>
          <th>Item / Dish</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Total Amount Paid:</td>
          <td style="text-align: right; color: #3F7D58; font-size: 16px;">KES ${amount}</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 13px; color: #756D66; text-align: center; margin-top: 24px;">
      This serves as an official electronic receipt. Prices are inclusive of all applicable catering levies and VAT.
    </p>

    <div style="text-align: center;">
      <a href="${CLIENT_ORIGIN}/dashboard" class="btn-action" target="_blank">View in Order History →</a>
    </div>
  `;

  const text = `Payment Receipt\n\nTransaction: ${txnId}\nOrder: #${orderId}\nAmount Paid: KES ${amount}\nMethod: ${method}\nDate: ${dateStr}\n\nThank you for dining with Jiwekee!`;

  return sendEmail({
    to: email,
    subject,
    html: wrapHtmlLayout({ title: subject, previewText, bodyContent }),
    text,
  });
}
