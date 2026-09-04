import { NextRequest, NextResponse } from 'next/server';
import { resortChatbot } from '@/ai/flows/resort-chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const result = await resortChatbot({ message, history });
    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Chat API error]', msg);
    return NextResponse.json(
      { reply: `I'm having trouble right now. (${msg})` },
      { status: 200 }
    );
  }
}
