import { Router } from 'express';
import { redirectLink } from '../controllers/linkController.js';

const router = Router();

// Public short links: http://localhost:5000/:alias
router.get('/:alias', redirectLink);

export default router;