
'use server';
/**
 * @fileOverview Generates a unique ID for a user and stores it in their profile.
 *
 * - generateUniqueId - A function that handles the unique ID generation process.
 * - GenerateUniqueIdInput - The input type for the generateUniqueId function.
 * - GenerateUniqueIdOutput - The return type for the generateUniqueId function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { randomUUID } from 'crypto';

const GenerateUniqueIdInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate a unique ID for.'),
});
export type GenerateUniqueIdInput = z.infer<typeof GenerateUniqueIdInputSchema>;

const GenerateUniqueIdOutputSchema = z.object({
  uniqueId: z.string().describe('The unique ID generated for the user.'),
});
export type GenerateUniqueIdOutput = z.infer<typeof GenerateUniqueIdOutputSchema>;

export async function generateUniqueId(input: GenerateUniqueIdInput): Promise<GenerateUniqueIdOutput> {
  return generateUniqueIdFlow(input);
}

const generateUniqueIdFlow = ai.defineFlow(
  {
    name: 'generateUniqueIdFlow',
    inputSchema: GenerateUniqueIdInputSchema,
    outputSchema: GenerateUniqueIdOutputSchema,
  },
  async ({ userId }) => {
    if (!userId) {
      throw new Error('User is not authenticated.');
    }

    const uniqueId = randomUUID();
    const userDocRef = doc(db, 'users', userId);

    await updateDoc(userDocRef, {
      uniqueId: uniqueId,
    });

    return { uniqueId };
  }
);
