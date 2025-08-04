// app/api/lottery/latest/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const latest = await prisma.lotteryRound.findFirst({
      orderBy: { round_date: 'desc' },
      include: {
        results: {
          include: { prizeType: true },
        },
      },
    });

    return NextResponse.json(latest);
  } catch (err: unknown) {
    console.error('❌ Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}