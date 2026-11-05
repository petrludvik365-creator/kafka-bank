// Cloudflare Pages Function: GET /api/certificate?session_id=cs_...
// Verifies a paid Stripe Checkout Session and returns the data for the certificate.
// Needs the secret (environment variable) STRIPE_SECRET_KEY – a restricted key with
// "Checkout Sessions: Read" is enough.

const MIN_AMOUNT = 100;   // smallest accepted amount in minor units (1.00 EUR = 100; Czech link is 1 EUR, English 9.99 EUR)
const CURRENCY = 'eur';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

// Same hash as the preview on the home page, so name -> number is identical.
function numberFor(name) {
  var h = 2166136261, s = name.toLowerCase(), i;
  for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ('000000' + ((h >>> 0) % 1000000)).slice(-6);
}

function pragueDate(unixSeconds) {
  var parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', year: 'numeric'
  }).formatToParts(new Date(unixSeconds * 1000));
  var o = {};
  parts.forEach(function (p) { o[p.type] = p.value; });
  return { year: o.year, text: parseInt(o.day, 10) + '. ' + parseInt(o.month, 10) + '. ' + o.year };
}

export async function onRequestGet(context) {
  var env = context.env;
  var id = new URL(context.request.url).searchParams.get('session_id') || '';

  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json({ error: 'bad_request' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'server_misconfigured' }, 500);

  var res;
  try {
    res = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
      headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY }
    });
  } catch (e) {
    return json({ error: 'upstream_unreachable' }, 502);
  }
  if (res.status === 404) return json({ error: 'not_found' }, 404);
  if (!res.ok) return json({ error: 'upstream_error' }, 502);

  var s = await res.json();
  if (s.payment_status !== 'paid') return json({ error: 'not_paid' }, 402);
  if (s.currency !== CURRENCY || !(s.amount_total >= MIN_AMOUNT)) return json({ error: 'wrong_product' }, 403);

  // Name: the first text custom field the customer filled in; fallback to the billing name.
  var name = '';
  (s.custom_fields || []).forEach(function (f) {
    if (!name && f.text && f.text.value) name = f.text.value;
  });
  if (!name && s.customer_details && s.customer_details.name) name = s.customer_details.name;
  name = String(name).replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

  var d = pragueDate(s.created);
  return json({ name: name, year: d.year, number: numberFor(name), date: d.text });
}
