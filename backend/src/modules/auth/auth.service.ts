import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../../lib/prisma.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: Transporter | null = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const MASTER_OTP = process.env.MASTER_OTP || '123456';

export const AuthService = {
  // Generate 6-digit numeric OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send Email OTP
  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string; previewOtp?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate existing unused OTPs
    await prisma.emailOtp.updateMany({
      where: { email: trimmedEmail, used: false },
      data: { used: true },
    });

    // Save new OTP
    await prisma.emailOtp.create({
      data: {
        email: trimmedEmail,
        otp,
        expiresAt,
        used: false,
      },
    });

    // Console logging for instant developer visibility & zero-dependency local testing
    console.log('\n======================================================');
    console.log(`🔑 [EMAIL OTP DISPATCH]`);
    console.log(`📧 To: ${trimmedEmail}`);
    console.log(`🔐 Verification OTP Code: ${otp} | ⚡ MASTER OTP: ${MASTER_OTP}`);
    console.log(`⏰ Valid for 10 minutes (expires: ${expiresAt.toLocaleTimeString()})`);
    console.log('======================================================\n');

    // Send real email via SMTP if configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"PG Flow Ecosystem" <${SMTP_USER}>`,
          to: trimmedEmail,
          subject: `${otp} is your PG Flow Verification Code`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #f8fafc; padding: 32px; border-radius: 12px; max-width: 480px; margin: auto;">
              <h2 style="color: #818cf8; margin-bottom: 8px;">PG Flow Security</h2>
              <p style="color: #94a3b8; font-size: 14px;">Use the verification code below to securely log into your account.</p>
              <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); padding: 18px; border-radius: 10px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #a5b4fc;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (err: any) {
        console.warn('SMTP delivery notice (console fallback active):', err.message);
      }
    }

    return {
      success: true,
      message: `Verification code sent to ${trimmedEmail}. Dev Master OTP is ${MASTER_OTP}`,
      previewOtp: MASTER_OTP,
    };
  },

  // Verify OTP
  async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // ⚡ Master OTP bypass: allows instant login to every registered account
    if (cleanOtp === MASTER_OTP) {
      console.log(`⚡ [MASTER OTP] Verification successful for "${trimmedEmail}" using Master Code (${MASTER_OTP})`);
      return true;
    }

    const validOtp = await prisma.emailOtp.findFirst({
      where: {
        email: trimmedEmail,
        otp: cleanOtp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) return false;

    // Mark as used
    await prisma.emailOtp.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    return true;
  },
};
