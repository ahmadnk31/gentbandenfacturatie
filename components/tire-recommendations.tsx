'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

interface TireSizeRecommendation {
    size: string;
    count: number;
}

interface TireRecommendationsProps {
    recommendations: TireSizeRecommendation[];
}

export function TireRecommendations({ recommendations }: TireRecommendationsProps) {
    if (recommendations.length === 0) return null;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Populaire Maten</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                    {recommendations.map((rec) => (
                        <div
                            key={rec.size}
                            className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary transition-colors rounded-lg px-3 py-2 border border-border/50"
                        >
                            <span className="font-semibold text-sm">{rec.size}</span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-1.5 py-0">
                                {rec.count}x
                            </Badge>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">
                    Meest verkochte maten op basis van eerdere facturen.
                </p>
            </CardContent>
        </Card>
    );
}
