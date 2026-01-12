'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from './actions';

export default function LoginPage() {
    const [state, action, pending] = useActionState(login, null);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Inloggen</CardTitle>
                    <CardDescription>
                        Voer het wachtwoord in om toegang te krijgen tot het facturatiesysteem.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                name="password"
                                placeholder="Wachtwoord"
                                required
                            />
                        </div>
                        {state?.error && (
                            <div className="text-sm text-red-500">
                                {state.error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={pending}>
                            {pending ? 'Bezig met inloggen...' : 'Inloggen'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
