import express from 'express';
import {createDecision, getDecisions, editDecisions, deleteDecisions} from "../Controller/decisionController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
const router = express.Router();

router.post('/create',authMiddleware,createDecision);
router.get('/getDecisions',authMiddleware, getDecisions);
router.patch('/editDecisions/:id',authMiddleware,editDecisions)
router.delete('/deleteDecisions/:id',authMiddleware,deleteDecisions)

export default router;