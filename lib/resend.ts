import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email functionality will not work.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
