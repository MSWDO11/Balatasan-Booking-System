import { NextRequest, NextResponse } from 'next/server';
import { explainError } from '@/ai/flows/error-explainer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { errorMessage, context } = body;

    if (!errorMessage) {
      return NextResponse.json({
        friendlyMessage: "Something went wrong.",
        suggestion: "Please try refreshing the page.",
      });
    }

    const result = await explainError({ errorMessage, context });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      friendlyMessage: "Something unexpected happened while loading this page.",
      suggestion: "Please try refreshing the page or come back shortly.",
    });
  }
}
