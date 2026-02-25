import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { publishCalculator, getPublishedCalculator, getPublicCalculator, unpublishCalculator } from '../controllers/publishController';

const router = Router();

// Authenticated routes
router.post('/calculator', authenticate, publishCalculator);
router.get('/calculator', authenticate, getPublishedCalculator);
router.delete('/calculator', authenticate, unpublishCalculator);

// Public route — NO AUTH (read-only)
router.get('/public/calculator/:slug', getPublicCalculator);

export default router;
