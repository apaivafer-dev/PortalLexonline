import { Router } from 'express';
import { getAllUsers, createUser, toggleUserStatus, updateUserPlan, getAdminStats } from '../controllers/adminController';
import { authenticate, requireOwner } from '../middleware/auth';

const router = Router();

// All admin routes require Owner role
router.use(authenticate, requireOwner);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/stats', getAdminStats);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/plan', updateUserPlan);

export default router;
