'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
    const password = formData.get('password');
    const correctPassword = process.env.AUTH_PASSWORD;

    if (password === correctPassword) {
        (await cookies()).set('auth-token', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        redirect('/');
    }

    return { error: 'Ongeldig wachtwoord' };
}

export async function logout() {
    (await cookies()).delete('auth-token');
    redirect('/login');
}
