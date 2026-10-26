
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, text, html }) {
    const { data, error } = await resend.emails.send({
        from: "DecisionFlow <onboarding@resend.dev>",
        to: [to],
        subject,
        text,
        html,
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error(error.message);
    }

    return data;
}
