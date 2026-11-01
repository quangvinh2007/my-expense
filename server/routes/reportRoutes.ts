import { Router } from 'express';
import {
  getOverview,
  getMonthlyReport,
  getCategoryReport,
} from '../controllers/reportController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.get('/overview', getOverview);
router.get('/monthly', getMonthlyReport);
router.get('/categories', getCategoryReport);

export default router;
