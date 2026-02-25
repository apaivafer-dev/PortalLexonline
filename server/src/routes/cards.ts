import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCards, createCard, updateCard, deleteCard } from '../controllers/cardsController';

const router = Router();

router.use(authenticate);

router.get('/', getCards);
router.post('/', createCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
