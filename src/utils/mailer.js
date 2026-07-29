const nodemailer = require("nodemailer");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.replace(/\s+/g, ""), // Gmail App Passwords are often copied with spaces
      },
    });
  }
  return transporter;
}

/**
 * Sends an email. If SMTP is not configured (e.g. local dev), falls back to
 * logging the content to the console so the flow can still be tested end-to-end.
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    console.log("──────────────────────────────────────────");
    console.log(`[mailer:dev-fallback] SMTP not configured. Would send email:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    console.log("──────────────────────────────────────────");
    return { simulated: true };
  }

  return t.sendMail({
    from: process.env.SMTP_FROM || '"RoomNest" <no-reply@roomnest.in>',
    to,
    subject,
    html,
  });
}

function otpEmailTemplate(name, otp) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#101B34;">Verify your RoomNest account</h2>
      <p>Hi ${name || "there"},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color:#C79A2B;">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      <p style="color:#888; font-size:12px;">— RoomNest, verified rooms not just listings.</p>
    </div>
  `;
}

module.exports = { sendMail, otpEmailTemplate };
