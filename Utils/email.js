import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, text, html }) {
    return transporter.sendMail({
        from: `"DecisionFlow" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
    });
}
