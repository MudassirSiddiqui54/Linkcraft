import { UAParser } from 'ua-parser-js';
import Click from '../models/Click.js';

export function parseClick(req) {
  const ua = new UAParser(req.get('user-agent') || '').getResult();
  const type = ua.device.type;
  const device = type === 'mobile' ? 'Mobile' : type === 'tablet' ? 'Tablet' : type === 'bot' ? 'Bot' : ua.browser.name ? 'Desktop' : 'Other';
  let referrer = 'Direct / Unknown';
  try { const raw = req.get('referer'); if (raw) referrer = new URL(raw).hostname; } catch { /* malformed referrer is ignored */ }
  return { referrer: referrer.slice(0, 500), device, browser: (ua.browser.name || 'Unknown').slice(0, 80) };
}

// Fire-and-forget: redirect response is never held open for analytics persistence.
export function recordClick(linkId, req) {
  const event = parseClick(req);
  setImmediate(() => Click.create({ linkId, ...event }).catch(err => console.error('Click event write failed:', err.message)));
}
