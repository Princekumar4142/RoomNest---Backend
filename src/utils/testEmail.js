// Standalone SMTP test — run this to check ONLY whether your email credentials work,
// separate from the rest of the app.
//
// Usage:
//   cd backend
//   node src/utils/testEmail.js you@example.com
//
require("dotenv").config();
const nodemailer = require("nodemailer");

const to = process.argv[2];

if (!to) {
  console.log("Usage: node src/utils/testEmail.js your-email@example.com");
  process.exit(1);
}

console.log("── Checking environment variables ──");
console.log("SMTP_HOST:", process.env.SMTP_HOST || "❌ NOT SET");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "❌ NOT SET");
console.log("SMTP_USER:", process.env.SMTP_USER || "❌ NOT SET");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? `set (${process.env.SMTP_PASS.length} characters)` : "❌ NOT SET");
console.log("SMTP_FROM:", process.env.SMTP_FROM || "❌ NOT SET (will use a default)");
console.log("");

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log("❌ One or more SMTP variables are missing from backend/.env — the app will silently");
  console.log("   fall back to console-logging OTPs instead of sending real email. Fix your .env first.");
  process.exit(1);
}

if (process.env.SMTP_PASS.includes(" ")) {
  console.log("⚠️  Your SMTP_PASS contains spaces. Gmail App Passwords are shown as 'abcd efgh ijkl mnop'");
  console.log("   but should usually be entered WITHOUT spaces: abcdefghijklmnop. Trying anyway...\n");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

console.log(`── Verifying connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} ──`);

transporter.verify((err) => {
  if (err) {
    console.log("❌ Connection/auth failed:");
    console.log(err.message);
    console.log("");
    console.log("Common causes:");
    console.log("1. SMTP_PASS is your normal Gmail password, not a 16-character App Password.");
    console.log("2. 2-Step Verification isn't enabled on the Google account (App Passwords require it).");
    console.log("3. Spaces left in the App Password.");
    console.log("4. SMTP_USER doesn't exactly match the Gmail account the App Password was created for.");
    process.exit(1);
  }

  console.log("✅ Connection & authentication successful. Sending a test email...\n");

  transporter.sendMail(
    {
      from: process.env.SMTP_FROM || `"RoomNest" <${process.env.SMTP_USER}>`,
      to,
      subject: "RoomNest SMTP test",
      html: "<p>If you're reading this, your SMTP setup works correctly. ✅</p>",
    },
    (err, info) => {
      if (err) {
        console.log("❌ Connected fine, but sending failed:");
        console.log(err.message);
        process.exit(1);
      }
      console.log("✅ Email sent. messageId:", info.messageId);
      console.log("   Check the inbox (and Spam/Promotions folder) of:", to);
    }
  );
});
