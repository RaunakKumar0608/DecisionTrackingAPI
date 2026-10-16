import express from "express";
import {
    addAdmin,
    addMember,
    createGroup,
    getMembers,
    leaveGroup,
    removeMember,
} from "../controller/groupController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createGroup",authMiddleware, createGroup)
router.post("/addMember",authMiddleware, addMember)
router.post("/removeMember",authMiddleware, removeMember)
router.post("/addAdmin",authMiddleware, addAdmin)
router.post("/leaveGroup",authMiddleware, leaveGroup)
router.get("/getMembers",authMiddleware, getMembers)

export default router;
