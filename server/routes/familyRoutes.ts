import { Router } from 'express';
import {
  createFamily,
  getMyFamily,
  joinFamily,
  updateFamily,
  removeMember,
} from '../controllers/familyController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.post('/', createFamily);
router.get('/', getMyFamily);
router.post('/join', joinFamily);
router.put('/:id', updateFamily);
router.delete('/:id/members/:userId', removeMember);

export default router;
