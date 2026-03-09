import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.SES_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY ?? "",
  },
});

const TO_EMAIL = process.env.SES_TO_EMAIL ?? "hires360s@gmail.com";
const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "hires360s@gmail.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, workEmail, companyName, phone, companySize, message, heardAbout } = body;

    const htmlBody = `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${fullName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${workEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Company</td><td style="padding:8px;border:1px solid #ddd;">${companyName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${phone || "—"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Company Size</td><td style="padding:8px;border:1px solid #ddd;">${companySize || "—"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Message</td><td style="padding:8px;border:1px solid #ddd;">${message || "—"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Heard About Us</td><td style="padding:8px;border:1px solid #ddd;">${heardAbout || "—"}</td></tr>
      </table>
      <p style="margin-top:16px;color:#666;font-size:13px;">Submitted at ${new Date().toISOString()}</p>
    `;

    await ses.send(
      new SendEmailCommand({
        Source: `Corenet Sales <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: `New Lead: ${fullName} — ${companyName}` },
          Body: { Html: { Data: htmlBody } },
        },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("SES send error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
