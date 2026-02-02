'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Plus, Home, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';

export function Header() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/invoices', label: 'Facturen', icon: FileText },
        { href: '/invoices/new', label: 'Nieuwe Factuur', icon: Plus },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1">
                        <Image
                            src="/logo.png"
                            alt="Gent Banden Logo"
                            width={42}
                            height={42}
                            className="h-10 w-10 object-cover"
                            priority
                            unoptimized
                        />
                    </div>
                    <span className="hidden sm:inline-block">
                        Gent Bandenservice Facturatie
                    </span>
                </Link>

                <nav className="ml-auto flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-secondary text-foreground'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden md:inline-block">{item.label}</span>
                            </Link>
                        );
                    })}
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden md:inline-block">Uitloggen</span>
                        </button>
                    </form>
                </nav>
            </div>
        </header>
    );
}
