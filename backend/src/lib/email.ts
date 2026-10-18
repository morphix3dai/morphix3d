import { Resend } from "resend";
import { config } from "../config";

const resend = new Resend(config.resendApiKey || "re_placeholder");

// ──────────────────────────────────────────────
// Password-reset email
// ──────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!config.resendApiKey) {
    // Dev fallback — just log it so local testing works without a real key
    console.log("📧 [DEV] Password reset email would be sent to:", to);
    console.log("🔗 Reset URL:", resetUrl);
    return;
  }

  await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: "Reset your Morphix 3D password",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0f;margin:0;padding:0;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td align="center" style="padding-bottom:32px;">
        <span style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#00F0FF,#0EA5E9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          Morphix 3D
        </span>
      </td>
    </tr>
    <tr>
      <td style="background:#12121f;border:1px solid #1e1e3a;border-radius:16px;padding:40px;">
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Reset your password</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px;">
          You requested a password reset for your Morphix 3D account. Click the button below to set a new password. This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#00F0FF,#0EA5E9);color:#0a0a0f;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px;margin:32px 0 0;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#64748b;font-size:12px;margin:16px 0 0;word-break:break-all;">
          Or copy this link: <a href="${resetUrl}" style="color:#00F0FF;">${resetUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:24px;">
        <p style="color:#334155;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} Morphix 3D. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ──────────────────────────────────────────────
// Welcome email (on signup)
// ──────────────────────────────────────────────
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  if (!config.resendApiKey) {
    console.log("📧 [DEV] Welcome email would be sent to:", to);
    return;
  }

  await resend.emails.send({
    from: config.emailFrom,
    to,
    subject: "Welcome to Morphix 3D 🎉",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0f;margin:0;padding:0;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td align="center" style="padding-bottom:32px;">
        <span style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#00F0FF,#0EA5E9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          Morphix 3D
        </span>
      </td>
    </tr>
    <tr>
      <td style="background:#12121f;border:1px solid #1e1e3a;border-radius:16px;padding:40px;">
        <h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Welcome, ${name}! 🚀</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
          You've just joined the future of 3D creation. Your account comes with <strong style="color:#00F0FF;">200 free credits</strong> to get started.
        </p>
        <ul style="color:#94a3b8;font-size:15px;line-height:2;padding-left:20px;margin:0 0 32px;">
          <li>Text → 3D model in seconds</li>
          <li>Image → 3D model from any photo</li>
          <li>AI Texturing, Smart Remesh, Auto-Rigging</li>
          <li>Architecture plans & Mechanical CAD</li>
        </ul>
        <a href="${config.frontendUrl}/workspace/text-to-3d" style="display:inline-block;background:linear-gradient(135deg,#00F0FF,#0EA5E9);color:#0a0a0f;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Start Creating
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:24px;">
        <p style="color:#334155;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} Morphix 3D. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
