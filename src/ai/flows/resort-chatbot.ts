'use server';
/**
 * Resort chatbot flow — answers guest questions about Balatasan Beach Resort.
 * Uses Gemini Flash with a grounded system prompt containing resort knowledge.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe('The guest message or question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Previous conversation turns.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  reply: z.string().describe('The assistant reply to the guest.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function resortChatbot(input: ChatInput): Promise<ChatOutput> {
  return resortChatbotFlow(input);
}

const SYSTEM_PROMPT = `You are Kira, the friendly AI assistant for Balatasan Beach Resort in Bulalacao, Oriental Mindoro, Philippines.

You help guests with questions about:
- Accommodations: Shore Cottages and Floating Cottages available for rent
- Tours: Island Hopping to Aslom, Sibalat, Target, Buyayao, Suguicay, and Silad islands
- Water Activities: Flying Fish (₱500, max 3 pax, 15 mins), Jet Ski (₱150/min, max 2 pax)
- Pricing: Cottages from ₱250/person, Island hopping from ₱1,500/person
- Booking: Guests book online, pay via GCash, and upload proof of payment
- Location: Balatasan, Bulalacao, Oriental Mindoro

Rules:
- Be warm, friendly, and concise — like a helpful local guide
- If you don't know something specific (like current availability), tell them to contact the resort directly
- Always encourage guests to book through the website
- Reply in the same language the guest uses (Filipino or English)
- Keep replies short — 2-4 sentences max unless a list is needed`;

const resortChatbotFlow = ai.defineFlow(
  {
    name: 'resortChatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ message, history = [] }) => {
    const historyText = history
      .map(h => `${h.role === 'user' ? 'Guest' : 'Kira'}: ${h.content}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}

${historyText ? `Conversation so far:\n${historyText}\n` : ''}Guest: ${message}
Kira:`;

    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
    });

    return { reply: text?.trim() ?? "I'm sorry, I couldn't process that. Please try again." };
  }
);
