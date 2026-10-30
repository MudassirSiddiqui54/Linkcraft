import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createLink, listLinks, updateLink, deleteLink, getAnalytics } from '../controllers/linkController.js';
import { requireLinkOwner } from '../middleware/ownerAuth.js';

const router = Router();
const createLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many links created from this network. Try again in an hour.' } } });
router.post('/links', createLimiter, createLink);
router.get('/links', listLinks);
router.get('/links/:alias/analytics', requireLinkOwner, getAnalytics);
router.patch('/links/:alias', requireLinkOwner, updateLink);
router.delete('/links/:alias', requireLinkOwner, deleteLink);
export default router;
