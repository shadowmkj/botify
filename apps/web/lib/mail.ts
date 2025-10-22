import nodemailer from 'nodemailer';
import { env } from './env';

interface ISendMail {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
} as any)

export async function sendMail({ to, subject, text, html, from }: ISendMail) {
    const startTime = Date.now();
    console.log(`Sending email to ${to} with subject: ${subject}`);

    try {
        const info = await transporter.sendMail({
            from: from || process.env.SMTP_FROM,
            to,
            subject,
            text,
            html,
        });

        const duration = Date.now() - startTime;
        console.log(`Email sent successfully in ${duration}ms. MessageId: ${info.messageId}, Accepted: ${info.accepted.length}, Rejected: ${info.rejected.length}`);

        return {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Email send failed after ${duration}ms:`, error);

        // Map common errors to user-friendly messages
        if (error && typeof error === 'object' && 'code' in error) {
            const err = error as { code?: string };
            if (err.code === 'EAUTH') {
                throw new Error('Authentication failed. Check SMTP credentials.');
            } else if (err.code === 'ECONNREFUSED') {
                throw new Error('Connection to SMTP server failed.');
            } else if (err.code === 'ETIMEDOUT') {
                throw new Error('Email send timed out.');
            }
        }
        throw new Error('Failed to send email. Please try again later.');
    }
}
