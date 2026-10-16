import express from "express";
import { Users, membersDecisions,getMyGroups} from "../Controller/UserController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

const router = express.Router();




router.post("/users",authMiddleware,Users);
router.post("/myGroups",authMiddleware,getMyGroups)
router.post("/membersDecisions",authMiddleware,membersDecisions)

export default router;
