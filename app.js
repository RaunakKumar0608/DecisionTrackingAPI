import express from 'express';
import cors from 'cors';
import ConnectDB from "./db/db.js";
import userRoutes from "./Router/UserRouter.js";
import decisionRoutes from "./Router/decisionRoutes.js";
import groupRoutes from "./Router/groupRouter.js";
import loginRoutes from "./Router/loginRouter.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://decisionfloww.vercel.app'
    ],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


ConnectDB();

app.use("/users",userRoutes);
app.use("/decisions",decisionRoutes);
app.use("/groups",groupRoutes);
app.use("/",loginRoutes);


const PORT = process.env.PORT || 7000;
app.set("trust proxy", 1);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});