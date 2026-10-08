import nodemailer from "nodemailer";
import { Resend } from "resend";
import { welcomeEmailTemplate, subscriptionConfirmationTemplate } from "../templates/email.templates.js";
import { SubscriptionEmailProps } from "../templates/email.templates.js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

interface SendEmailOption {
    to: string,
    subject: string,
    html: string
}

async function send(options: SendEmailOption){
    const isProduction = process.env.NODE_ENV === "production";
    const fromAddress = process.env.EMAIL_FROM || "Training Facility <eyosik55@gmail.com>";

    if(isProduction){
        const{ error } = await resend.emails.send({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html
        });

        if(error){
            throw new Error(`Resend delivery failed: ${error.message}`)
        }
    } else {
        await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html
        });
    }
};

export async function sendWelcomeEmail(to: string, name: string){
    await send({
        to,
        subject: "Welcome to our Training Facility!",
        html: welcomeEmailTemplate(name)
    });
};

export async function sendSubscriptionConfirmation(to: string, props: SubscriptionEmailProps){
    await send({
        to,
        subject: "Subscription Confirmed!",
        html: subscriptionConfirmationTemplate(props)
    });
};