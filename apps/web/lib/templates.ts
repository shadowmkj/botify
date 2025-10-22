interface PasswordResetTemplateData {
  resetUrl: string;
  userEmail: string;
}

export function renderPasswordResetEmail(data: PasswordResetTemplateData): { subject: string; html: string; text: string } {
  const subject = "Reset your password";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body>
      <h1>Password Reset</h1>
      <p>Hello,</p>
      <p>You requested a password reset for your account (${data.userEmail}).</p>
      <p>Click the link below to reset your password:</p>
      <a href="${data.resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    </body>
    </html>
  `;

  const text = `
    Password Reset

    Hello,

    You requested a password reset for your account (${data.userEmail}).

    Click the link below to reset your password:
    ${data.resetUrl}

    If you didn't request this, please ignore this email.

    This link will expire in 1 hour.
  `;

  return { subject, html, text };
}