import { Resend } from 'resend';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';

const VERIFICATION_TTL_MINUTES = 10;

let resendClient: Resend | null = null;

const isResendConfigured = () => Boolean(env.RESEND_API_KEY);

const getFromAddress = () =>
    env.EMAIL_FROM || env.SMTP_FROM || 'OpusHire <onboarding@resend.dev>';

const getResend = () => {
    if (!env.RESEND_API_KEY) {
        throw createError('Email verification is not configured on the server.', 503);
    }
    if (!resendClient) {
        resendClient = new Resend(env.RESEND_API_KEY);
    }
    return resendClient;
};

export const isEmailVerificationConfigured = () => isResendConfigured();

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

    const { error } = await getResend().emails.send({
        from: getFromAddress(),
        to: email,
        subject: 'Verify your OpusHire account',
        text: [
            `Hi ${name},`,
            '',
            `Your OpusHire verification code is: ${code}`,
            '',
            `This code expires in ${VERIFICATION_TTL_MINUTES} minutes.`,
            `You can also verify here: ${verifyUrl}`,
            '',
            'If you did not create this account, you can ignore this email.',
        ].join('\n'),
        html: `
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
        `,
    });

    if (error) {
        throw createError(`Failed to send verification email: ${error.message}`, 502);
    }
};