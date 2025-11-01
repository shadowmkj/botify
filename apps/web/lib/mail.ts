import nodemailer from 'nodemailer';

interface ISendMail {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

export async function sendMail({ to, subject, text, html }: ISendMail) {
    const startTime = Date.now();
    console.log(`Sending email to ${to} with subject: ${subject}`);

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
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
    throw new Error("Failed to send email. Please try again later.");
  }
}
