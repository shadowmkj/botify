"use server"

import { sendMail } from "@/lib/mail"
import { renderPasswordResetEmail } from "@/lib/templates"

interface SendPasswordResetEmailParams {
  email: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ email, resetUrl }: SendPasswordResetEmailParams) {
  const template = renderPasswordResetEmail({ userEmail: email, resetUrl });

  return await sendMail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}