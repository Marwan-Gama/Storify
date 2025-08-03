const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send verification email
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${process.env.APP_URL}/verify-email/${token}`;

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Verify Your Email - Cloud Storage",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Cloud Storage!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated email from Cloud Storage. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${process.env.APP_URL}/reset-password/${token}`;

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Reset Your Password - Cloud Storage",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated email from Cloud Storage. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  // Send file share notification
  async sendFileShareNotification(email, fileName, ownerName, shareUrl) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: `${ownerName} shared a file with you - Cloud Storage`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">File Shared With You</h2>
            <p><strong>${ownerName}</strong> has shared a file with you:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0; color: #333;">${fileName}</h3>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View File
              </a>
            </div>
            <p>Click the button above to view the shared file.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated email from Cloud Storage. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`File share notification sent to ${email}`);
    } catch (error) {
      console.error("Error sending file share notification:", error);
      throw new Error("Failed to send file share notification");
    }
  }

  // Send storage limit warning
  async sendStorageLimitWarning(email, userName, usagePercentage) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Storage Limit Warning - Cloud Storage",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107;">Storage Limit Warning</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You are approaching your storage limit. You have used <strong>${usagePercentage}%</strong> of your available storage.</p>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                Consider upgrading to a premium plan for more storage space or delete some files to free up space.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}/dashboard" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Manage Storage
              </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated email from Cloud Storage. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Storage limit warning sent to ${email}`);
    } catch (error) {
      console.error("Error sending storage limit warning:", error);
      throw new Error("Failed to send storage limit warning");
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service configuration error:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
