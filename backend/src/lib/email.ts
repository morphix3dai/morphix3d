import { Resend } from "resend";
import { config } from "../config";

const resend = new Resend(config.resendApiKey || "re_placeholder");

// ──────────────────────────────────────────────
// Password-reset email (Unified Warm Architectural Paper Theme)
// ──────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!config.resendApiKey) {
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
<body style="background:#F4F1E6;margin:0;padding:0;font-family:Inter,Arial,sans-serif;color:#141413;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <span style="font-size:28px;font-weight:800;color:#141413;letter-spacing:-0.02em;">
          Morphix <span style="color:#FF6A1A;">3D</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="background:#FAF8F2;border:2px solid #141413;border-radius:16px;padding:40px;box-shadow:6px 6px 0px #141413;">
        <h1 style="color:#141413;font-size:24px;margin:0 0 16px;">Reset your password</h1>
        <p style="color:#4A4945;font-size:15px;line-height:1.6;margin:0 0 28px;">
          You requested a password reset for your Morphix 3D Studio account. Click the button below to set a new password. This link expires in <strong style="color:#141413;">1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#141413;color:#FAF8F2;font-weight:700;font-size:14px;padding:14px 28px;border:1.5px solid #141413;box-shadow:3px 3px 0px #FF6A1A;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;">
          Reset Password →
        </a>
        <p style="color:#6E6C65;font-size:13px;margin:28px 0 0;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#6E6C65;font-size:12px;margin:12px 0 0;word-break:break-all;">
          Or copy this link: <a href="${resetUrl}" style="color:#FF6A1A;font-weight:600;">${resetUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:24px;">
        <p style="color:#6E6C65;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} Morphix 3D (3dmorphix.com). All rights reserved.
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
// Welcome email (on signup — Warm Architectural Paper Theme)
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
    subject: "Welcome to Morphix 3D Studio — 200 Free Credits Inside",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#F4F1E6;margin:0;padding:0;font-family:Inter,Arial,sans-serif;color:#141413;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <span style="font-size:28px;font-weight:800;color:#141413;letter-spacing:-0.02em;">
          Morphix <span style="color:#FF6A1A;">3D</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="background:#FAF8F2;border:2px solid #141413;border-radius:16px;padding:40px;box-shadow:6px 6px 0px #141413;">
        <h1 style="color:#141413;font-size:24px;margin:0 0 16px;">Welcome, ${name}!</h1>
        <p style="color:#4A4945;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Your Morphix 3D Studio drafting table is ready with <strong style="color:#FF6A1A;">200 free studio credits</strong>.
        </p>
        <ul style="color:#4A4945;font-size:14px;line-height:1.9;padding-left:20px;margin:0 0 28px;">
          <li><strong>Mechanical CAD:</strong> Parametric B-Rep gears &amp; brackets (.STEP, .STL, .DXF)</li>
          <li><strong>Architecture BIM:</strong> 2D floor plans extruded to 3D cutaways</li>
          <li><strong>Creative 3D Atelier:</strong> Text &amp; Image to 4K PBR quad meshes + 65-bone rigging</li>
        </ul>
        <a href="${config.frontendUrl}/workspace/mechanical" style="display:inline-block;background:#141413;color:#FAF8F2;font-weight:700;font-size:14px;padding:14px 28px;border:1.5px solid #141413;box-shadow:3px 3px 0px #FF6A1A;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;">
          Launch Morphix Studio →
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:24px;">
        <p style="color:#6E6C65;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} Morphix 3D (3dmorphix.com). All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
