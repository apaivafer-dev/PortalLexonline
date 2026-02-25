import { Router } from 'express';
import { calculateRescisao } from '../services/calculatorService';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/calculate', authenticate, async (req, res) => {
    try {
        const result = calculateRescisao(req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Erro ao realizar cálculo' });
    }
});

export default router;
