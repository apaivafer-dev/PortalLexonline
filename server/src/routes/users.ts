import { Router } from 'express';
import { getProfile, updateProfile, getCompanyProfile, updateCompanyProfile } from '../controllers/usersController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/company', getCompanyProfile);
router.put('/company', updateCompanyProfile);

export default router;
