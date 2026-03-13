import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';

const VERIFICATION_TTL_MINUTES = 10;

let resendClient: Resend | null = null;
let smtpTransporter: any = null;

const getFromAddress = () =>
    env.EMAIL_FROM || env.SMTP_FROM || 'OpusHire <onboarding@resend.dev>';

const getTransporter = () => {
    if (smtpTransporter) return smtpTransporter;

    // Only use Nodemailer if SMTP settings are provided and NOT pointing to Resend sandbox
    // (Resend SMTP has the same sandbox restrictions as the SDK)
    const smtpHost = (env.SMTP_HOST || '').trim();
    const smtpHostLower = smtpHost.toLowerCase();
    const smtpUser = (env.SMTP_USER || '').trim();
    const smtpPass = (env.SMTP_PASS || '').trim();

    if (smtpHost && smtpUser && smtpPass && !smtpHostLower.includes('resend.com')) {
        smtpTransporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(env.SMTP_PORT || '587', 10),
            secure: env.SMTP_SECURE === 'true',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
        return smtpTransporter;
    }
    return null;
};

const getResend = () => {
    if (!env.RESEND_API_KEY) return null;
    if (!resendClient) {
        resendClient = new Resend(env.RESEND_API_KEY);
    }
    return resendClient;
};

export const isEmailVerificationConfigured = () => 
    Boolean(getTransporter() || getResend());

export const getVerificationTtlMinutes = () => VERIFICATION_TTL_MINUTES;

export const sendVerificationCodeEmail = async ({
    email,
    name,
    code,
}: {
    email: string;
    name: string;
    code: string;
}) => {
    const verifyUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`;
    const subject = 'Verify your OpusHire account';
    const text = [
        `Hi ${name},`,
        '',
        `Your OpusHire verification code is: ${code}`,
        '',
        `This code expires in ${VERIFICATION_TTL_MINUTES} minutes.`,
        `You can also verify here: ${verifyUrl}`,
        '',
        'If you did not create this account, you can ignore this email.',
    ].join('\n');
    const html = `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 12px;color:#0f172a;">Verify your OpusHire account</h2>
            <p style="margin:0 0 16px;">Hi ${name},</p>
            <p style="margin:0 0 16px;">Use this verification code to activate your new account:</p>
            <div style="margin:0 0 20px;padding:16px 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;font-size:28px;font-weight:700;letter-spacing:8px;text-align:center;color:#1d4ed8;">${code}</div>
            <p style="margin:0 0 16px;">This code expires in <strong>${VERIFICATION_TTL_MINUTES} minutes</strong>.</p>
            <p style="margin:0 0 20px;">
                <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">Open verification page</a>
            </p>
            <p style="margin:0;color:#475569;font-size:14px;">If you did not create this account, you can ignore this email.</p>
        </div>
    `;

    // Try Real SMTP first (to bypass Sandbox limits)
    const transporter = getTransporter();
    if (transporter) {
        try {
            await transporter.sendMail({
                from: getFromAddress(),
                to: email,
                subject,
                text,
                html,
            });
            console.log(`[EMAIL] Real SMTP delivery success to ${email}`);
            return;
        } catch (err: any) {
            console.warn(`[EMAIL] Real SMTP failed, falling back to Resend: ${err.message}`);
        }
    }

    // Fallback to Resend SDK
    const resend = getResend();
    if (!resend) {
        throw createError('No valid email provider (SMTP or Resend) configured.', 503);
    }

    const { error } = await resend.emails.send({
        from: getFromAddress(),
        to: email,
        subject,
        text,
        html,
    });

    if (error) {
        // Dev fallback for Sandbox errors
        const resendErrorMessage = String(error.message || '');
        const isSandboxError = resendErrorMessage
            .toLowerCase()
            .includes('only send testing emails to your own email address');
        if (env.NODE_ENV === 'development' && isSandboxError) {
            console.log('\n--- [SANDBOX MODE] EMAIL BYPASS ---');
            console.log(`TO: ${email}`);
            console.log(`CODE: ${code}`);
            console.log('--- Resend Sandbox Restricted this recipient ---\n');
            return;
        }
        throw createError(`Failed to send verification email: ${resendErrorMessage || 'Unknown email provider error'}`, 502);
    }
};