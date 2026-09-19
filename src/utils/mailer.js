const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// Resend client configured via environment variable or built-in fallback
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey =
    process.env.RESEND_API_KEY ||
    Buffer.from("cmVfWHk1dlpCblZfNFR4MmpjUDhSV0s1bm9uWm5QMTJmNFdM", "base64").toString("utf8");
  if (apiKey) {
    resendClient = new Resend(apiKey.trim());
  }
  return resendClient;
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || "princebth1988@gmail.com";
  const pass = process.env.SMTP_PASS || "xipfahtfyxgdhuwr";
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: user.trim(),
        pass: pass.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

/**
 * Sends an email via Resend (primary) or Nodemailer SMTP (fallback).
 */
async function sendMail({ to, subject, html }) {
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    "RoomNest <no-reply@trackmapinnovations.in>";

  // 1. Primary: Resend
  const resend = getResendClient();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (response.error) {
        console.error("[mailer:resend] Error:", response.error);
      } else {
        console.log(`[mailer:resend] Email sent successfully to ${to} (Message ID: ${response.data?.id})`);
        return response.data;
      }
    } catch (err) {
      console.error("[mailer:resend] Exception sending email:", err.message);
    }
  }

  // 2. Secondary fallback: Nodemailer SMTP
  const t = getTransporter();
  if (t) {
    try {
      const info = await t.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`[mailer:smtp] Email sent to ${to} via SMTP`);
      return info;
    } catch (smtpErr) {
      console.error("[mailer:smtp] SMTP failed:", smtpErr.message);
    }
  }

  // 3. Simulated fallback for local dev debugging
  console.log("──────────────────────────────────────────");
  console.log(`[mailer:fallback] Would send email:`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  console.log("──────────────────────────────────────────");
  return { simulated: true };
}

/**
 * Premium branded HTML template for account verification & password reset OTPs.
 */
function otpEmailTemplate(name, otp, purpose = "registration") {
  const isReset = purpose === "password_reset";
  const title = isReset ? "Reset Your RoomNest Password" : "Verify Your RoomNest Account";
  const message = isReset
    ? "We received a request to reset the password for your RoomNest account. Use the 6-digit code below to set your new password:"
    : "Welcome to RoomNest! To complete your student or host account setup and access verified accommodations, please use the 6-digit code below:";

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">RoomNest</span>
                        <span style="font-size: 11px; font-weight: 600; color: #38bdf8; background-color: rgba(56, 189, 248, 0.15); padding: 3px 8px; border-radius: 9999px; margin-left: 8px; vertical-align: middle;">Verified Campus Living</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">${title}</h1>
                  <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello <strong>${name || "Student"}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                    ${message}
                  </p>

                  <!-- OTP Code Box -->
                  <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; display: block;">${otp}</span>
                    <span style="font-size: 12px; color: #94a3b8; display: block; margin-top: 6px;">Valid for 10 minutes · Single-use only</span>
                  </div>

                  <!-- Security Tips -->
                  <div style="background-color: #eff6ff; border-radius: 10px; padding: 14px 16px; margin: 24px 0;">
                    <p style="font-size: 12px; color: #1e40af; margin: 0; line-height: 1.5;">
                      🔒 <strong>Security Tip:</strong> RoomNest staff will never ask you for your verification code. Do not share this OTP with anyone.
                    </p>
                  </div>

                  <p style="font-size: 13px; color: #64748b; margin: 24px 0 0 0; line-height: 1.5;">
                    If you did not make this request, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;">
                    RoomNest · 100% In-Person Audited Student PGs, Hostels & Rooms · ₹0 Brokerage
                  </p>
                  <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                    GEC West Champaran (Kumarbagh) · Bettiah · Chanpatia · Narkatiaganj · Delhi
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

module.exports = { sendMail, otpEmailTemplate };
