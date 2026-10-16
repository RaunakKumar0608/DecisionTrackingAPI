import express from 'express';
import {createUser, login, logout} from "../Controller/UserController.js";

const router = express.Router();

router.post("/register",createUser);
router.post("/login",login);
router.post("/logout",logout);

export default router;