'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI-Powered Content Assistant.
 * It provides a function to generate engaging and descriptive text for resort listings.
 *
 * - adminContentGenerator - A function that generates marketing copy for resort listings.
 * - AdminContentGeneratorInput - The input type for the adminContentGenerator function.
 * - AdminContentGeneratorOutput - The return type for the adminContentGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema Definition
const AdminContentGeneratorInputSchema = z.object({
  itemType: z.enum(['room', 'tour']).describe('The type of listing, either "room" or "tour".'),
  name: z.string().optional().describe('The name of the room or title of the tour.'),
  title: z.string().optional().describe('Alternative field for the title of the tour.'),
  capacity: z.string().optional().describe('The guest capacity (can be a range like "10-15").'),
  price: z.number().optional().describe('The price of the listing.'),
  pricePerPerson: z.number().optional().describe('The price per person for the tour.'),
  duration: z.string().optional().describe('The duration of the tour (e.g., "4 hours", "full day").'),
  existingDescription: z.string().optional().describe('Any existing descriptive text to elaborate on.'),
  keyFeatures: z.array(z.string()).optional().describe('A list of key features or highlights of the listing.'),
});
export type AdminContentGeneratorInput = z.infer<typeof AdminContentGeneratorInputSchema>;

// Output Schema Definition
const AdminContentGeneratorOutputSchema = z.object({
  generatedText: z.string().describe('The generated engaging and descriptive text for the listing.'),
});
export type AdminContentGeneratorOutput = z.infer<typeof AdminContentGeneratorOutputSchema>;

// Wrapper function to call the flow
export async function adminContentGenerator(input: AdminContentGeneratorInput): Promise<AdminContentGeneratorOutput> {
  return adminContentGeneratorFlow(input);
}

// Genkit Prompt Definition
const adminContentPrompt = ai.definePrompt({
  name: 'adminContentGeneratorPrompt',
  model: 'googleai/gemini-3.6-flash',
  input: {schema: AdminContentGeneratorInputSchema},
  output: {schema: AdminContentGeneratorOutputSchema},
  prompt: `You are an expert marketing copywriter for Balatasan Beach Resort. 
Generate an engaging and descriptive text for a {{itemType}}.

Details:
{{#if name}}Name/Title: {{{name}}}{{/if}}
{{#if title}}Title: {{{title}}}{{/if}}
{{#if capacity}}Capacity: {{{capacity}}} guests{{/if}}
{{#if price}}Price: ₱{{{price}}}{{/if}}
{{#if pricePerPerson}}Price per person: ₱{{{pricePerPerson}}}{{/if}}
{{#if duration}}Duration: {{{duration}}}{{/if}}
{{#if existingDescription}}Base Description: {{{existingDescription}}}{{/if}}
{{#if keyFeatures}}
Highlights:
{{#each keyFeatures}}
- {{{this}}}
{{/each}}
{{/if}}

Write a compelling, enthusiastic, and concise description that highlights the guest experience and the unique tropical atmosphere of Bulalacao.`,
});

// Genkit Flow Definition
const adminContentGeneratorFlow = ai.defineFlow(
  {
    name: 'adminContentGeneratorFlow',
    inputSchema: AdminContentGeneratorInputSchema,
    outputSchema: AdminContentGeneratorOutputSchema,
  },
  async input => {
    try {
      const {output} = await adminContentPrompt(input);
      if (!output) {
        throw new Error('Failed to generate content: output is undefined.');
      }
      return output;
    } catch (error) {
      console.error('Error in Genkit flow:', error);
      throw error;
    }
  }
);
