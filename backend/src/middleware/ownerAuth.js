import crypto from 'node:crypto';
import Link from '../models/Link.js';
import { AppError } from '../utils/errors.js';

export const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
export async function requireLinkOwner(req, res, next) {
  try {
    const token = req.get('x-link-owner');
    if (!token || token.length < 32 || token.length > 256) throw new AppError(401, 'Management key is missing or invalid.', 'UNAUTHORIZED');
    const link = await Link.findOne({ alias: req.params.alias }).select('+ownerTokenHash');
    if (!link) throw new AppError(404, 'Link not found.', 'NOT_FOUND');
    const actual = Buffer.from(hashToken(token));
    const expected = Buffer.from(link.ownerTokenHash);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new AppError(403, 'You do not have permission to manage this link.', 'FORBIDDEN');
    req.link = link;
    next();
  } catch (error) { next(error); }
}
