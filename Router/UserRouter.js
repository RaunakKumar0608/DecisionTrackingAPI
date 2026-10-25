import express from "express";
import {Users, membersDecisions, getMyGroups, createUser, verifyEmailOtp , resendEmailOtp} from "../Controller/UserController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/users",authMiddleware,Users);
router.post("/myGroups",authMiddleware,getMyGroups)
router.get("/membersDecisions",authMiddleware,membersDecisions)
router.post("/verify-email", verifyEmailOtp);
router.post("/register", createUser);
router.post("/resend-otp", resendEmailOtp);

export default router;
