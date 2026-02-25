import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannersController';

const router = Router();

router.use(authenticate);

router.get('/', getBanners);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
