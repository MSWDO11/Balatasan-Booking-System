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
    console.error('[Chat API error]', error);
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble right now. Please try again in a moment." },
      { status: 200 } // Return 200 so client shows graceful message
    );
  }
}
