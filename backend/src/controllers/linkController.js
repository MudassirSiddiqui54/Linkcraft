import crypto from 'node:crypto';
import { customAlphabet } from 'nanoid';
import Link from '../models/Link.js';
import Click from '../models/Click.js';
import { hashToken } from '../middleware/ownerAuth.js';
import { AppError } from '../utils/errors.js';
import { createLinkSchema, updateLinkSchema, normalizeDestination } from '../utils/validation.js';
import { recordClick } from '../services/analytics.js';

const makeAlias = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);
const publicUrl = alias => `${(process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '')}/${alias}`;
const shape = link => ({ id: link._id, alias: link.alias, shortUrl: publicUrl(link.alias), destination: link.destination, title: link.title, enabled: link.enabled, expiresAt: link.expiresAt, totalClicks: link.totalClicks, createdAt: link.createdAt, updatedAt: link.updatedAt, expired: Boolean(link.expiresAt && link.expiresAt <= new Date()) });

export async function createLink(req, res, next) {
  try {
    const data = createLinkSchema.parse(req.body);
    let chosen = data.alias || makeAlias();
    if (!data.alias) {
      for (let i = 0; i < 5 && await Link.exists({ alias: chosen }); i++) chosen = makeAlias();
    }
    const ownerToken = crypto.randomBytes(32).toString('base64url');
    const link = await Link.create({ alias: chosen, destination: normalizeDestination(data.destination), title: data.title, expiresAt: data.expiresAt, ownerTokenHash: hashToken(ownerToken) });
    res.status(201).json({ data: { link: shape(link), ownerToken, recoveryKey: ownerToken } });
  } catch (error) { next(error); }
}

export async function listLinks(req, res, next) {
  try {
    const raw = req.get('x-link-owners');
    if (!raw) return res.json({ data: { links: [] } });
    let entries;
    try { entries = JSON.parse(raw); } catch { throw new AppError(400, 'Saved link credentials are malformed.'); }
    if (!Array.isArray(entries) || entries.length > 200 || entries.some(x => !x || typeof x.alias !== 'string' || typeof x.token !== 'string')) throw new AppError(400, 'Saved link credentials are invalid.');
    const aliases = [...new Set(entries.map(x => x.alias))];
    const links = await Link.find({ alias: { $in: aliases } }).select('+ownerTokenHash').sort({ createdAt: -1 }).limit(200);
    const tokenMap = new Map(entries.map(x => [x.alias, x.token]));
    const owned = links.filter(link => { const token = tokenMap.get(link.alias); return token && hashToken(token) === link.ownerTokenHash; });
    res.json({ data: { links: owned.map(shape) } });
  } catch (error) { next(error); }
}

export async function updateLink(req, res, next) {
  try {
    const data = updateLinkSchema.parse(req.body);
    if (data.destination) req.link.destination = normalizeDestination(data.destination);
    for (const key of ['title', 'expiresAt', 'enabled']) if (key in data) req.link[key] = data[key];
    req.link.updatedAt = new Date();
    await req.link.save();
    res.json({ data: { link: shape(req.link) } });
  } catch (error) { next(error); }
}

export async function deleteLink(req, res, next) {
  try { await Click.deleteMany({ linkId: req.link._id }); await req.link.deleteOne(); res.status(204).end(); }
  catch (error) { next(error); }
}

export async function redirectLink(req, res, next) {
  try {
    const link = await Link.findOne({ alias: req.params.alias }).select('destination enabled expiresAt');
    if (!link) return res.status(404).send(errorPage('Link not found', 'This short link does not exist or may have been removed.'));
    if (!link.enabled) return res.status(410).send(errorPage('Link disabled', 'The owner has temporarily disabled this link.'));
    if (link.expiresAt && link.expiresAt <= new Date()) return res.status(410).send(errorPage('Link expired', 'This short link has passed its expiry date.'));
    recordClick(link._id, req);
    Link.updateOne({ _id: link._id }, { $inc: { totalClicks: 1 } }).catch(err => console.error('Click counter update failed:', err.message));
    return res.redirect(302, link.destination);
  } catch (error) { next(error); }
}
function errorPage(title, message) { return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Linkcraft</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d12;color:#f4f5f7;font:16px system-ui"><main style="max-width:440px;padding:32px;text-align:center"><p style="color:#a78bfa;letter-spacing:.12em;text-transform:uppercase;font-size:12px">LINKCRAFT</p><h1>${title}</h1><p style="color:#a6a9b4;line-height:1.6">${message}</p><a style="color:#c4b5fd" href="${(process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/"/g, '')}">Go to Linkcraft</a></main></body></html>`; }

export async function getAnalytics(req, res, next) {
  try {
    const link = req.link;
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 86400000);
    const match = { linkId: link._id, clickedAt: { $gte: since } };
    const [daily, referrers, devices, browsers, recent] = await Promise.all([
      Click.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }, clicks: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Click.aggregate([{ $match: match }, { $group: { _id: '$referrer', clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }, { $limit: 8 }]),
      Click.aggregate([{ $match: match }, { $group: { _id: '$device', clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }]),
      Click.aggregate([{ $match: match }, { $group: { _id: '$browser', clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }, { $limit: 8 }]),
      Click.countDocuments(match)
    ]);
    res.json({ data: { link: shape(link), rangeDays: days, clicksInRange: recent, daily, referrers, devices, browsers } });
  } catch (error) { next(error); }
}
