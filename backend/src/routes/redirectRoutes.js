import { Router } from 'express';
import { redirectLink } from '../controllers/linkController.js';

const router = Router();

// Public short links: http://localhost:5000/redirect/:alias
router.get('/redirect/:alias', redirectLink);

export default router;