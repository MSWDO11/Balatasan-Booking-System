import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { to, guestName, itemName, startDate, endDate, guestCount, totalPrice, refId, status } = await req.json();

    if (!to) return NextResponse.json({ error: 'No recipient email' }, { status: 400 });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const statusColor = status === 'Confirmed' ? '#065f46' : status === 'Cancelled' ? '#991b1b' : '#92400e';
    const statusBg = status === 'Confirmed' ? '#d1fae5' : status === 'Cancelled' ? '#fee2e2' : '#fef3c7';
    const emoji = status === 'Confirmed' ? '🎉' : status === 'Cancelled' ? '❌' : '⏳';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#12AFAB 0%,#0e8f8b 100%);padding:36px 32px 28px;text-align:center;">
      <img src="https://balatasan-booking-system-git-main-leonard315s-projects.vercel.app/logo.png" alt="Balatasan" width="64" height="64"
        style="border-radius:50%;border:3px solid rgba(255,255,255,0.4);margin-bottom:14px;"/>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;">Balatasan Resort</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0;letter-spacing:0.08em;text-transform:uppercase;">Booking Notification</p>
    </div>

    <!-- Status Banner -->
    <div style="background:${statusBg};padding:14px 32px;text-align:center;border-bottom:1px solid #e2e8f0;">
      <span style="font-size:16px;font-weight:800;color:${statusColor};">${emoji} Booking ${status}</span>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi <strong>${guestName}</strong>, your booking has been updated.</p>

      <!-- Receipt card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:4px;">Reference ID</td>
            <td style="font-size:14px;font-weight:800;color:#0f172a;text-align:right;font-family:monospace;letter-spacing:0.06em;">${refId}</td>
          </tr>
          <tr><td colspan="2" style="padding:6px 0;border-top:1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:6px 0;">Booking</td>
            <td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;padding:6px 0;">${itemName}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:6px 0;">Check-in</td>
            <td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;padding:6px 0;">${startDate}</td>
          </tr>
          ${endDate && endDate !== startDate ? `
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:6px 0;">Check-out</td>
            <td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;padding:6px 0;">${endDate}</td>
          </tr>` : ''}
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;padding:6px 0;">Guests</td>
            <td style="font-size:13px;font-weight:600;color:#1e293b;text-align:right;padding:6px 0;">${guestCount}</td>
          </tr>
        </table>
      </div>

      <!-- Total -->
      <div style="background:linear-gradient(135deg,#f0fdf9,#f0fdfa);border:1px solid #99f6e4;border-radius:14px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <span style="font-size:12px;color:#0f766e;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Total Amount</span>
        <span style="font-size:28px;font-weight:900;color:#12AFAB;">₱${Number(totalPrice).toLocaleString()}</span>
      </div>

      ${status === 'Confirmed' ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
        <p style="font-size:13px;color:#1e40af;margin:0;line-height:1.6;">
          ✅ Your booking is confirmed! Please proceed to the resort on your scheduled date.<br/>
          <strong>Balatasan Beach Resort</strong> · Bulalacao, Oriental Mindoro
        </p>
      </div>` : ''}

      <p style="font-size:13px;color:#64748b;margin:0;">
        Questions? Contact us at your resort's contact number or visit our website.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.7;">
        Balatasan Beach Resort · Bulalacao, Oriental Mindoro, Philippines<br/>
        This is an automated email. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Balatasan Resort" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${emoji} Booking ${status} - ${itemName} | Balatasan Resort`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email error]', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
