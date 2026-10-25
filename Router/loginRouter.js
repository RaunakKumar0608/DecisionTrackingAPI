import express from 'express';
import {createUser, login, logout} from "../Controller/UserController.js";
import loginLimiter from "../middleware/loginLimiter.js";
import registerLimiter from "../middleware/registerLimiter.js";

const router = express.Router();

router.post("/register",registerLimiter,createUser);
router.post("/login",loginLimiter ,login);
router.post("/logout",logout);

export default router;