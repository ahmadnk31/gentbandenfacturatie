'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Plus, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileText className="h-4 w-4" />
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
                </nav>
            </div>
        </header>
    );
}
