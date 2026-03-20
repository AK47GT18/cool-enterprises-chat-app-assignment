import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const DEFAULT_FROM = `"Cool Chat App" <${process.env.SMTP_USERNAME}>`;

export const EmailService = {
  async sendPasswordResetCode(to: string, code: string) {
    const html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Verification Code</h2>
        <p style="color: #475569; font-size: 16px; text-align: center;">
          Enter the following 6-digit code to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; background: #f1f5f9; padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${code}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; text-align: center;">
          This code will expire in 15 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: DEFAULT_FROM,
        to,
        subject: `${code} is your reset code`,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send password reset code:', error);
      return { success: false, error };
    }
  },

  /**
   * Send a group invitation email
   */
  async sendGroupInvite(to: string, groupName: string, inviteLink: string, inviterName: string) {
    const html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b;">You're Invited!</h2>
        <p style="color: #475569; font-size: 16px;">
          <strong>${inviterName}</strong> has invited you to join the private group <strong>"${groupName}"</strong>!
        </p>
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
          Join ${groupName}
        </a>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          Clicking the link will automatically add you to the group using the secure invite code.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: DEFAULT_FROM,
        to,
        subject: `Invite: Join ${groupName} on Cool Chat`,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send group invite email:', error);
      return { success: false, error };
    }
  }
};
