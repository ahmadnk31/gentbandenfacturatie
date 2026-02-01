import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPDF } from '@/components/report-pdf';
import { getReportData, ReportData } from '@/lib/report-actions';

export async function POST(request: NextRequest) {
    try {
        const { type, date } = await request.json();

        if (!type || !date) {
            return NextResponse.json(
                { error: 'Missing parameters' },
                { status: 400 }
            );
        }

        const data: ReportData = await getReportData(type, new Date(date));

        const pdfBuffer = await renderToBuffer(ReportPDF({ data }));

        const filename = `Rapportage-${type}-${new Date(date).toISOString().split('T')[0]}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Generate Report error:', error);
        return NextResponse.json(
            { error: 'Kon rapportage niet genereren' },
            { status: 500 }
        );
    }
}
