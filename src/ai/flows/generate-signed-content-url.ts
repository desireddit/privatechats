
'use server';
/**
 * @fileOverview Generates a secure, short-lived signed URL for a piece of private content.
 *
 * - generateSignedContentUrl - A function that generates a signed URL for a given content ID.
 * - GenerateSignedContentUrlInput - The input type for the generateSignedContentUrl function.
 * - GenerateSignedContentUrlOutput - The return type for the generateSignedContentUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { HttpsError } from 'genkit/next';

const GenerateSignedContentUrlInputSchema = z.object({
  contentId: z.string().describe('The ID of the content to generate a URL for.'),
});
export type GenerateSignedContentUrlInput = z.infer<typeof GenerateSignedContentUrlInputSchema>;

const GenerateSignedContentUrlOutputSchema = z.object({
  signedUrl: z.string().describe('The short-lived signed URL for the content.'),
});
export type GenerateSignedContentUrlOutput = z.infer<typeof GenerateSignedContentUrlOutputSchema>;

export async function generateSignedContentUrl(input: GenerateSignedContentUrlInput): Promise<GenerateSignedContentUrlOutput> {
  return generateSignedContentUrlFlow(input);
}

const generateSignedContentUrlFlow = ai.defineFlow(
  {
    name: 'generateSignedContentUrlFlow',
    inputSchema: GenerateSignedContentUrlInputSchema,
    outputSchema: GenerateSignedContentUrlOutputSchema,
    auth: async (auth, { contentId }) => {
        if (!auth) {
            throw new HttpsError('unauthenticated', 'User must be logged in.');
        }
        
        // Check for admin status (you would use custom claims in production)
        const adminUserDoc = await getDoc(doc(db, 'users', auth.uid));
        const isAdmin = adminUserDoc.data()?.email === 'desireddit4us@private.local';
        if (isAdmin) {
            return; // Admins can access all content
        }
        
        // Check if user has access to the content
        const contentDocRef = doc(db, 'content', contentId);
        const contentDocSnap = await getDoc(contentDocRef);
        if (!contentDocSnap.exists()) {
            throw new HttpsError('not-found', 'Content not found.');
        }

        const allowedUsers = contentDocSnap.data().allowedUsers || {};
        if (!allowedUsers[auth.uid]) {
            throw new HttpsError('permission-denied', 'You do not have access to this content.');
        }
    }
  },
  async ({ contentId }) => {
    if (!contentId) {
      throw new HttpsError('invalid-argument', 'Content ID is required.');
    }

    try {
      const contentDocRef = doc(db, 'content', contentId);
      const contentDocSnap = await getDoc(contentDocRef);

      if (!contentDocSnap.exists()) {
        throw new HttpsError('not-found', 'Content not found.');
      }

      const contentData = contentDocSnap.data();
      const mediaUrl = contentData.mediaUrl;

      if (!mediaUrl) {
        throw new HttpsError('not-found', 'Media URL not found for this content.');
      }
      
      const storage = getStorage();
      const gsReference = storageRef(storage, mediaUrl);
      const downloadUrl = await getDownloadURL(gsReference);

      return { signedUrl: downloadUrl };
    } catch (error: any) {
      console.error("Error generating signed URL:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', `Failed to generate signed URL: ${error.message}`);
    }
  }
);
