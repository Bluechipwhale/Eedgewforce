// ==============================================================================
// EDGEWFORCE - SALES AI COPILOT ROUTES
// ==============================================================================

import express from 'express';
import { aiController } from '../controllers/accountingController.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.use(requireAuth);
router.use(rateLimit({ windowMs: 60000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: { message: 'Please wait a minute before requesting another briefing.' } } }));
router.get('/insights', aiController.getBriefing);
router.post('/copilot', aiController.askCopilot);

export default router;
