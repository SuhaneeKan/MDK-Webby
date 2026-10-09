```js
import { validateEnquiry } from '../src/validate-enquiry.mjs';

const requests = new Map();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const {
    FORMS_ENABLED,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY,
    ENQUIRY_FROM,
    ENQUIRY_TO,
    SITE_URL,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM,
    ENQUIRY_SMS_TO,
  } = process.env;

  // Email and database are required. SMS is optional.
  if (
    FORMS_ENABLED !== 'true' ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !RESEND_API_KEY ||
    !ENQUIRY_FROM ||
    !ENQUIRY_TO ||
    !SITE_URL
  ) {
    return res.status(503).json({
      error: 'Online enquiries are temporarily unavailable. Please email or call MDK directly.',
    });
  }

  let origin;

  try {
    origin = new URL(SITE_URL).origin;
  } catch {
    return res.status(503).json({
      error: 'Enquiries are temporarily unavailable.',
    });
  }

  // Allow requests only from the configured site origin.
  if (req.headers.origin !== origin) {
    return res.status(403).json({
      error: 'Request origin not allowed.',
    });
  }

  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'JSON required.' });
  }

  if (Number(req.headers['content-length'] || 0) > 12000) {
    return res.status(413).json({ error: 'Request too large.' });
  }

  let data;

  try {
    data = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      JSON.stringify(data).length > 12000
    ) {
      return res.status(400).json({
        error: 'Invalid or oversized request.',
      });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // Map the current contact form to the validator's expected field names.
  data = {
    ...data,
    organization: data.organization ?? data.company ?? '',
    industry: data.industry ?? 'Not specified',
    service: data.service ?? 'General enquiry',
  };

  const validationError = validateEnquiry(data);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Best-effort per-instance rate limit: 5 requests per 10 minutes per IP.
  const now = Date.now();

  for (const [key, value] of requests) {
    if (value.until < now) requests.delete(key);
  }

  const ip = String(
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    'unknown'
  ).split(',')[0];

  const record = requests.get(ip) || {
    count: 0,
    until: now + 600000,
  };

  if (record.count >= 5) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  record.count++;
  requests.set(ip, record);

  const enquiry = {
    name: data.name,
    organization: data.organization,
    designation: data.designation || '',
    email: data.email,
    phone: data.phone || '',
    industry: data.industry,
    service: data.service,
    topic: data.topic || '',
    date: data.date || '',
    time: data.time || '',
    mode: data.mode || '',
    message: data.message,
  };

  const supabaseUrl = SUPABASE_URL.replace(/\/+$/, '');

  // Save the enquiry before sending notifications.
  try {
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/mdk_enquiries`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(enquiry),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!dbResponse.ok) {
      console.error(
        'MDK Supabase insert failed:',
        dbResponse.status,
        await dbResponse.text()
      );

      return res.status(502).json({
        error: 'Your enquiry could not be saved. Please try again later.',
      });
    }
  } catch (err) {
    console.error('MDK database connection failed:', err);

    return res.status(502).json({
      error: 'Your enquiry could not be saved. Please try again later.',
    });
  }

  const labels = {
    name: 'Name',
    organization: 'Company',
    designation: 'Designation',
    email: 'Email',
    phone: 'Phone',
    industry: 'Industry',
    service: 'Service',
    topic: 'Topic',
    date: 'Preferred date',
    time: 'Preferred time (IST)',
    mode: 'Mode',
    message: 'Requirement',
  };

  const emailText = Object.entries(labels)
    .map(([key, label]) => `${label}: ${data[key] || 'Not provided'}`)
    .join('\n\n');

  // Send email notification.
  try {
    const emailResponse = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: ENQUIRY_FROM,
          to: [ENQUIRY_TO],
          reply_to: data.email,
          subject: 'New MDK consultation enquiry',
          text: emailText,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!emailResponse.ok) {
      console.error(
        'MDK email notification failed:',
        emailResponse.status,
        await emailResponse.text()
      );

      // The enquiry is already saved in Supabase.
      return res.status(200).json({
        ok: true,
        saved: true,
        emailDelivered: false,
        smsDelivered: false,
        notificationWarning: 'The enquiry was saved, but email notification failed.',
      });
    }
  } catch (err) {
    console.error('MDK email request failed:', err);

    return res.status(200).json({
      ok: true,
      saved: true,
      emailDelivered: false,
      smsDelivered: false,
      notificationWarning: 'The enquiry was saved, but email notification failed.',
    });
  }

  // Optional SMS notification. Enquiry details are not sent by SMS.
  let smsDelivered = false;

  if (
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_FROM &&
    ENQUIRY_SMS_TO
  ) {
    const recipients = ENQUIRY_SMS_TO
      .split(',')
      .map((number) => number.trim())
      .filter(Boolean)
      .slice(0, 2);

    const smsMessage =
      `New MDK enquiry from ${data.name} (${data.organization}). ` +
      'Check your email for details.';

    const results = await Promise.allSettled(
      recipients.map(async (to) => {
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization:
                'Basic ' +
                Buffer.from(
                  `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
                ).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: to,
              From: TWILIO_FROM,
              Body: smsMessage,
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!smsResponse.ok) {
          throw new Error(`Twilio returned ${smsResponse.status}`);
        }
      })
    );

    smsDelivered =
      results.length > 0 &&
      results.every((result) => result.status === 'fulfilled');

    if (!smsDelivered) {
      console.error('MDK SMS notification failed.');
    }
  }

  return res.status(200).json({
    ok: true,
    saved: true,
    emailDelivered: true,
    smsDelivered,
  });
}
```