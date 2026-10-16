import express from 'express';
import {createDecision, getDecisions} from "../Controller/decisionController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/create',authMiddleware,createDecision);
router.get('/getDecisions',authMiddleware, getDecisions);

export default router;