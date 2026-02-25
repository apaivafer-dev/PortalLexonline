import { Router } from 'express';
import { getPipelines, createPipeline, updatePipeline, deletePipeline } from '../controllers/pipelinesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getPipelines);
router.post('/', createPipeline);
router.put('/:id', updatePipeline);
router.delete('/:id', deletePipeline);

export default router;
