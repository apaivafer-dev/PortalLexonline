import { Router } from 'express';
import { getLeads, createLead, updateLead, deleteLead } from '../controllers/leadsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
