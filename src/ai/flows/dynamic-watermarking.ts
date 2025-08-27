
'use server';

/**
 * @fileOverview Implements dynamic watermarking functionality for private media.
 *
 * - generateDynamicWatermark - A function that applies a dynamic watermark (username and timestamp) to media.
 * - GenerateDynamicWatermarkInput - The input type for the generateDynamicWatermark function.
 * - GenerateDynamicWatermarkOutput - The return type for the generateDynamicWatermark function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDynamicWatermarkInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "The media to be watermarked, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  username: z.string().describe('The username to be watermarked on the media.'),
  timestamp: z.string().describe('The timestamp to be watermarked on the media.'),
});
export type GenerateDynamicWatermarkInput = z.infer<
  typeof GenerateDynamicWatermarkInputSchema
>;

const GenerateDynamicWatermarkOutputSchema = z.object({
  watermarkedMediaDataUri: z
    .string()
    .describe('The watermarked media as a data URI.'),
});
export type GenerateDynamicWatermarkOutput = z.infer<
  typeof GenerateDynamicWatermarkOutputSchema
>;

export async function generateDynamicWatermark(
  input: GenerateDynamicWatermarkInput
): Promise<GenerateDynamicWatermarkOutput> {
  return generateDynamicWatermarkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicWatermarkPrompt',
  input: {schema: GenerateDynamicWatermarkInputSchema},
  output: {schema: GenerateDynamicWatermarkOutputSchema},
  prompt: `You are an expert media processing AI.

You will apply a dynamic watermark to the given media. The watermark should include the username and timestamp provided.

The watermarked media should be returned as a data URI.

Source Media: {{media url=mediaDataUri}}
Username: {{{username}}}
Timestamp: {{{timestamp}}}

Ensure the watermark is clearly visible but does not obstruct the main content of the media. Place it semi-transparently at the bottom-center of the image.`,
});

const generateDynamicWatermarkFlow = ai.defineFlow(
  {
    name: 'generateDynamicWatermarkFlow',
    inputSchema: GenerateDynamicWatermarkInputSchema,
    outputSchema: GenerateDynamicWatermarkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // The model with vision capability should handle the watermarking and return the new data URI.
    // In a real implementation, if the model doesn't support direct image manipulation,
    // you would use a library like Sharp or Jimp here to process the image.
    // For this AI-powered example, we rely on the model's capabilities.
    return { watermarkedMediaDataUri: output!.watermarkedMediaDataUri };
  }
);
