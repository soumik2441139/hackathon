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

    if (smtpHost && smtpUser && smtpPass && !smtpHostLower.endsWith('resend.com')) {
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

export const sendAutoMatchEmail = async ({
    email,
    name,
    jobTitle,
    company,
    matchScore,
    jobUrl
}: {
    email: string;
    name: string;
    jobTitle: string;
    company: string;
    matchScore: number;
    jobUrl: string;
}) => {
    const subject = `🚀 You're a ${matchScore}% Match for a new role at ${company}!`;
    const html = `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
            <div style="text-align:center;margin-bottom:20px;">
                <h1 style="color:#2563eb;margin:0;font-size:24px;">OpusHire Premium Network</h1>
            </div>
            <h2 style="margin:0 0 16px;color:#0f172a;">Hey ${name}, we found a match!</h2>
            <p style="margin:0 0 16px;">Our AI just scanned a newly posted job and determined that your resume is a highly relevant mathematical match for the requirements.</p>
            
            <div style="margin:20px 0;padding:20px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
                <h3 style="margin:0 0 8px;font-size:18px;color:#1e293b;">${jobTitle}</h3>
                <p style="margin:0 0 12px;color:#475569;font-weight:600;">🏢 ${company}</p>
                <div style="display:inline-block;padding:4px 12px;background:#dbeafe;color:#1d4ed8;border-radius:9999px;font-weight:700;font-size:14px;">
                    🎯 ${matchScore}% Semantic Match
                </div>
            </div>

            <p style="margin:0 0 24px;">Click the button below to view the job details and submit your application instantly before the position closes.</p>
            
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${jobUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">View Job & Apply</a>
            </div>
            
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="margin:0;color:#64748b;font-size:12px;text-align:center;">
                You are receiving this email because your OpusHire profile represents an elite match for this position. If you wish to stop receiving Auto-Match alerts, you can update your notification preferences in your dashboard.
            </p>
        </div>
    `;

    // Try Real SMTP first
    const transporter = getTransporter();
    if (transporter) {
        try {
            await transporter.sendMail({
                from: getFromAddress(),
                to: email,
                subject,
                html,
            });
            console.log(`[EMAIL] Auto-Match alert successfully delivered via SMTP to ${email}`);
            return;
        } catch (err: any) {
            console.warn(`[EMAIL] Real SMTP failed: ${err.message}`);
        }
    }

    // Fallback to Resend SDK
    const resend = getResend();
    if (resend) {
        await resend.emails.send({
            from: getFromAddress(),
            to: email,
            subject,
            html,
        });
    }
};