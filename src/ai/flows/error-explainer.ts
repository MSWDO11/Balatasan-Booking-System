'use server';
/**
 * Error explainer flow — translates technical errors into friendly user messages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ErrorInputSchema = z.object({
  errorMessage: z.string().describe('The technical error message or stack trace.'),
  context: z.string().optional().describe('Where in the app the error occurred.'),
});
export type ErrorInput = z.infer<typeof ErrorInputSchema>;

const ErrorOutputSchema = z.object({
  friendlyMessage: z.string().describe('A friendly, non-technical explanation for the user.'),
  suggestion: z.string().describe('A simple action the user can take to fix it.'),
});
export type ErrorOutput = z.infer<typeof ErrorOutputSchema>;

export async function explainError(input: ErrorInput): Promise<ErrorOutput> {
  return errorExplainerFlow(input);
}

const errorExplainerFlow = ai.defineFlow(
  {
    name: 'errorExplainerFlow',
    inputSchema: ErrorInputSchema,
    outputSchema: ErrorOutputSchema,
  },
  async ({ errorMessage, context }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are a helpful assistant for Balatasan Beach Resort's booking website.
A user encountered a technical error. Translate it into a friendly, non-technical message.

Error: ${errorMessage}
${context ? `Location: ${context}` : ''}

Respond in JSON with exactly these two fields:
- "friendlyMessage": A warm, simple explanation (1-2 sentences, no technical jargon)
- "suggestion": One simple thing the user can try (e.g. "Try refreshing the page" or "Please check your internet connection")

JSON only, no markdown.`,
    });

    try {
      const cleaned = (text ?? "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        friendlyMessage: parsed.friendlyMessage ?? "Something went wrong on our end.",
        suggestion: parsed.suggestion ?? "Please try refreshing the page.",
      };
    } catch {
      return {
        friendlyMessage: "Something unexpected happened while loading this page.",
        suggestion: "Please try refreshing the page or come back shortly.",
      };
    }
  }
);
