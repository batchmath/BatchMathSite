const REPORT_PATH = '/api/report-problem';
const RESEND_API_URL = 'https://api.resend.com/emails';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_DESCRIPTION = 800;

function response(origin, status, body) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin'
  });
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean));
}

function text(value, maximum) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .slice(0, maximum);
}

function plainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validDiagnostic(diagnostic) {
  if (!plainObject(diagnostic)) return false;
  if (Number(diagnostic.schema) < 1 || Number(diagnostic.schema) > 10) return false;
  if (!text(diagnostic.engineId, 161).trim()) return false;
  if (!text(diagnostic.course, 161).trim()) return false;
  if (!text(diagnostic.seed, 161).trim()) return false;
  if (!text(diagnostic.path, 501).startsWith('/')) return false;
  const problemNumber = Number(diagnostic.problemNumber);
  if (!Number.isInteger(problemNumber) || problemNumber < 0 || problemNumber > 10000000) return false;
  if (diagnostic.submittedAnswer !== undefined && !plainObject(diagnostic.submittedAnswer)) return false;
  return true;
}

function safeSubjectPart(value, fallback) {
  const cleaned = text(value, 80).replace(/[\r\n\t]+/g, ' ').replace(/[^\w .:#/()-]/g, '').trim();
  return cleaned || fallback;
}

function configuredEmail(value) {
  const email = text(value, 320).trim();
  if (!email || /[\r\n]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function emailText(description, diagnostic, request) {
  const submittedAt = new Date().toISOString();
  const ray = text(request.headers.get('cf-ray') || 'not available', 120);
  return [
    'BatchMath Report a Problem',
    '',
    'Student description:',
    description,
    '',
    `Received: ${submittedAt}`,
    `Cloudflare Ray: ${ray}`,
    '',
    'Diagnostic ticket:',
    JSON.stringify(diagnostic, null, 2)
  ].join('\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const origins = allowedOrigins(env);
    const originAllowed = origins.has(origin);

    if (url.pathname !== REPORT_PATH) return response(originAllowed ? origin : '', 404, { ok: false });

    if (request.method === 'OPTIONS') {
      if (!originAllowed) return response('', 403, { ok: false });
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '600',
          'Cache-Control': 'no-store',
          'Vary': 'Origin'
        }
      });
    }

    if (request.method !== 'POST') return response(originAllowed ? origin : '', 405, { ok: false });
    if (!originAllowed || request.headers.get('Sec-Fetch-Site') === 'cross-site') return response('', 403, { ok: false });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) {
      return response(origin, 415, { ok: false });
    }

    const announcedLength = Number(request.headers.get('Content-Length') || 0);
    if (announcedLength > MAX_BODY_BYTES) return response(origin, 413, { ok: false });

    let rawBody;
    try { rawBody = await request.text(); } catch (_) { return response(origin, 400, { ok: false }); }
    if (!rawBody || new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return response(origin, 413, { ok: false });
    }

    let payload;
    try { payload = JSON.parse(rawBody); } catch (_) { return response(origin, 400, { ok: false }); }
    if (!plainObject(payload)) return response(origin, 400, { ok: false });

    // Quietly acknowledge automated form-fill submissions without sending mail.
    if (text(payload.website, 200).trim()) return response(origin, 200, { ok: true });

    const description = text(payload.description, MAX_DESCRIPTION).trim();
    const clientToken = text(payload.clientToken, 100);
    if (description.length < 3 || description.length > MAX_DESCRIPTION) return response(origin, 400, { ok: false });
    if (!/^[a-zA-Z0-9_-]{16,100}$/.test(clientToken)) return response(origin, 400, { ok: false });
    if (!validDiagnostic(payload.diagnostic)) return response(origin, 400, { ok: false });

    try {
      const rate = await env.REPORT_RATE_LIMITER.limit({ key: clientToken });
      if (!rate.success) return response(origin, 429, { ok: false });
    } catch (_) {
      return response(origin, 503, { ok: false });
    }

    const resendApiKey = text(env.RESEND_API_KEY, 500).trim();
    const reportTo = configuredEmail(env.REPORT_TO_EMAIL);
    const reportFrom = configuredEmail(env.REPORT_FROM_EMAIL);
    if (!resendApiKey || !reportTo || !reportFrom) return response(origin, 503, { ok: false });
    const diagnostic = payload.diagnostic;
    const engine = safeSubjectPart(diagnostic.engineId, 'unknown engine');
    const problem = safeSubjectPart(diagnostic.problemId, `problem ${diagnostic.problemNumber}`);

    let resendResponse;
    try {
      resendResponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: reportFrom,
          to: [reportTo],
          subject: `BatchMath Problem Report — ${engine} — ${problem}`.slice(0, 180),
          text: emailText(description, diagnostic, request)
        })
      });
    } catch (error) {
      console.error('Problem report Resend request failed', error?.name || 'network_error');
      return response(origin, 502, { ok: false });
    }

    if (!resendResponse.ok) {
      console.error('Problem report email rejected', `resend_status_${resendResponse.status}`);
      return response(origin, 502, { ok: false });
    }

    let receipt;
    try { receipt = await resendResponse.json(); } catch (_) { receipt = null; }
    if (!plainObject(receipt) || !text(receipt.id, 200).trim()) {
      console.error('Problem report email response invalid', 'missing_resend_id');
      return response(origin, 502, { ok: false });
    }

    return response(origin, 200, { ok: true });
  }
};
