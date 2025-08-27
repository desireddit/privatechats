'use server';
/**
 * @fileOverview Automatically generates a content title from its description using GenAI.
 *
 * - generateContentTitle - A function that generates a content title from a description.
 * - GenerateContentTitleInput - The input type for the generateContentTitle function.
 * - GenerateContentTitleOutput - The return type for the generateContentTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentTitleInputSchema = z.object({
  description: z.string().describe('The description of the content.'),
});
export type GenerateContentTitleInput = z.infer<typeof GenerateContentTitleInputSchema>;

const GenerateContentTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the content.'),
});
export type GenerateContentTitleOutput = z.infer<typeof GenerateContentTitleOutputSchema>;

export async function generateContentTitle(input: GenerateContentTitleInput): Promise<GenerateContentTitleOutput> {
  return generateContentTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentTitlePrompt',
  input: {schema: GenerateContentTitleInputSchema},
  output: {schema: GenerateContentTitleOutputSchema},
  prompt: `You are an expert content curator. Generate a concise and engaging title for the following content description:\n\nDescription: {{{description}}}`,
});

const generateContentTitleFlow = ai.defineFlow(
  {
    name: 'generateContentTitleFlow',
    inputSchema: GenerateContentTitleInputSchema,
    outputSchema: GenerateContentTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
