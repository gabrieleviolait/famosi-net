const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const escapeHtml = (value) => clean(value, 5000)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    console.error('Missing RESEND_API_KEY, MAIL_TO or MAIL_FROM');
    return json({ error: 'Servizio email non configurato.' }, 503);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return json({ error: 'Formato richiesta non valido.' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Dati non validi.' }, 400);
  }

  // Honeypot: bots usually fill hidden fields.
  if (clean(body.companyWebsite, 200)) {
    return json({ ok: true });
  }

  const name = clean(body.name, 120);
  const knownFor = clean(body.knownFor, 160);
  const email = clean(body.email, 180).toLowerCase();
  const website = clean(body.website, 300);
  const story = clean(body.story, 4000);
  const privacy = body.privacy === true;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
  const websiteOk = !website || /^https?:\/\//i.test(website);

  if (!name || !knownFor || !emailOk || !websiteOk || !privacy) {
    return json({ error: 'Controlla i campi obbligatori e riprova.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'n/d';
  const country = request.headers.get('CF-IPCountry') || 'n/d';
  const userAgent = clean(request.headers.get('user-agent'), 350);
  const submittedAt = new Date().toISOString();

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:720px">
      <h2>Nuova candidatura — FAMOSI.NET</h2>
      <p><strong>Nome / stage name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Known for:</strong> ${escapeHtml(knownFor)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Sito / profilo:</strong> ${website ? `<a href="${escapeHtml(website)}">${escapeHtml(website)}</a>` : '—'}</p>
      <p><strong>Story:</strong><br>${story ? escapeHtml(story).replaceAll('\n','<br>') : '—'}</p>
      <hr>
      <p style="font-size:12px;color:#666">Privacy accettata: sì<br>Data UTC: ${escapeHtml(submittedAt)}<br>Paese CF: ${escapeHtml(country)}<br>IP: ${escapeHtml(ip)}<br>User-Agent: ${escapeHtml(userAgent)}</p>
    </div>`;

  const text = [
    'Nuova candidatura — FAMOSI.NET',
    `Nome / stage name: ${name}`,
    `Known for: ${knownFor}`,
    `Email: ${email}`,
    `Sito / profilo: ${website || '—'}`,
    `Story: ${story || '—'}`,
    '',
    'Privacy accettata: sì',
    `Data UTC: ${submittedAt}`,
    `Paese CF: ${country}`,
    `IP: ${ip}`,
    `User-Agent: ${userAgent}`
  ].join('\n');

  const resend = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      reply_to: email,
      subject: `FAMOSI.NET — candidatura: ${name}`,
      html,
      text
    })
  });

  if (!resend.ok) {
    const detail = await resend.text();
    console.error('Resend error:', resend.status, detail);
    return json({ error: 'Impossibile inviare la candidatura in questo momento.' }, 502);
  }

  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: true, service: 'famosi-apply' });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS' } });
}
