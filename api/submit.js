export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const d = req.body;
  const sig = d['Signature'] || '';

  // Strip the data URI prefix to get raw base64 for email attachment
  const sigBase64 = sig.replace(/^data:image\/png;base64,/, '');

  // ── Email to organizer — full details + signature ──────────
  const organizerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 24px; }
    h1 { color: #f97316; font-size: 1.3rem; margin-bottom: 4px; }
    h2 { font-size: 1rem; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 6px 8px; font-size: 0.9rem; vertical-align: top; }
    td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
    .ref { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px 14px; font-size: 0.85rem; color: #92400e; margin-bottom: 20px; }
    .sig-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; background: #f9fafb; display: inline-block; margin-top: 8px; }
    img { display: block; max-width: 360px; }
  </style>
</head>
<body>
  <h1>🏰 Winona Ave Block Party — Bouncy Castle Waiver</h1>
  <div class="ref">
    <strong>Reference:</strong> ${d['Reference'] || '—'} &nbsp;·&nbsp;
    <strong>Submitted:</strong> ${d['Submitted'] || '—'}
  </div>

  <h2>Parent / Guardian</h2>
  <table>
    <tr><td>Name</td><td>${d['Parent Name'] || '—'}</td></tr>
    <tr><td>Email</td><td>${d['Parent Email'] || '—'}</td></tr>
    <tr><td>Phone</td><td>${d['Parent Phone'] || '—'}</td></tr>
    <tr><td>Address</td><td>${d['Parent Address'] || '—'}</td></tr>
  </table>

  <h2>Child</h2>
  <table>
    <tr><td>Name</td><td>${d['Child Name'] || '—'}</td></tr>
    <tr><td>Age</td><td>${d['Child Age'] || '—'}</td></tr>
    <tr><td>Date of Birth</td><td>${d['Child DOB'] || '—'}</td></tr>
    <tr><td>Weight (lbs)</td><td>${d['Child Weight (lbs)'] || '—'}</td></tr>
    <tr><td>Medical Notes</td><td>${d['Medical Notes'] || 'None'}</td></tr>
    <tr><td>Emergency Contact</td><td>${d['Emergency Contact'] || '—'}</td></tr>
  </table>

  <h2>Signature</h2>
  <table>
    <tr><td>Signed Date</td><td>${d['Signed Date'] || '—'}</td></tr>
  </table>
  ${sig
    ? `<div class="sig-box"><img src="cid:signature" alt="Signature" /></div>`
    : '<p style="color:#9ca3af;font-style:italic;">No signature captured.</p>'
  }
</body>
</html>`;

  // ── Confirmation email to signatory ───────────────────────
  const signatoryHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 24px; }
    h1 { color: #f97316; font-size: 1.3rem; margin-bottom: 4px; }
    .check { font-size: 2.5rem; margin-bottom: 8px; }
    .ref { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px 14px; font-size: 0.85rem; color: #92400e; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 6px 8px; font-size: 0.9rem; vertical-align: top; }
    td:first-child { font-weight: 600; color: #6b7280; width: 40%; }
    .sig-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; background: #f9fafb; display: inline-block; margin-top: 8px; }
    img { display: block; max-width: 360px; }
    .footer { margin-top: 32px; font-size: 0.78rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="check">✅</div>
  <h1>Your waiver has been received!</h1>
  <p>Hi ${d['Parent Name'] || 'there'},</p>
  <p style="margin-top:10px;">Thanks for signing the Winona Ave Block Party Bouncy Castle Waiver for <strong>${d['Child Name'] || 'your child'}</strong>. Please keep this email as your record.</p>

  <div class="ref">
    <strong>Reference:</strong> ${d['Reference'] || '—'} &nbsp;·&nbsp;
    <strong>Signed:</strong> ${d['Submitted'] || '—'}
  </div>

  <table>
    <tr><td>Child</td><td>${d['Child Name'] || '—'}, age ${d['Child Age'] || '—'}</td></tr>
    <tr><td>Emergency Contact</td><td>${d['Emergency Contact'] || '—'}</td></tr>
    <tr><td>Signed Date</td><td>${d['Signed Date'] || '—'}</td></tr>
  </table>

  <p style="margin-top:16px;font-size:0.9rem;">Your signature:</p>
  ${sig
    ? `<div class="sig-box"><img src="${sig}" alt="Your signature" /></div>`
    : '<p style="color:#9ca3af;font-style:italic;">No signature on file.</p>'
  }

  <div class="footer">
    This is an automated confirmation from the Winona Ave Block Party waiver system.
    If you did not sign this waiver, please contact the event organiser.
  </div>
</body>
</html>`;

  try {
    const send = (to, subject, html) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bouncy Castle Waivers <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          attachments: sigBase64 ? [{
            filename: `signature-${d['Reference'] || 'unknown'}.png`,
            content: sigBase64,
            content_id: 'signature',
          }] : [],
        }),
      });

    // Send both emails in parallel
    const [orgRes, sigRes] = await Promise.all([
      send('danobrien99@gmail.com',
           `✅ New Waiver: ${d['Child Name']} (${d['Parent Name']})`,
           organizerHtml),
      d['Parent Email']
        ? send(d['Parent Email'],
               `Your Bouncy Castle Waiver — ${d['Child Name']}`,
               signatoryHtml)
        : Promise.resolve({ ok: true }),
    ]);

    const orgResult = await orgRes.json();
    if (!orgRes.ok) {
      console.error('Resend organizer error:', orgResult);
      return res.status(500).json({ error: orgResult });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
