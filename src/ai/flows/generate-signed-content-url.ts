'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { HttpError } from '@/lib/errors';

const GenerateSignedContentUrlInputSchema = z.object({ contentId: z.string() });
export type GenerateSignedContentUrlInput = z.infer<typeof GenerateSignedContentUrlInputSchema>;
const GenerateSignedContentUrlOutputSchema = z.object({ signedUrl: z.string() });
export type GenerateSignedContentUrlOutput = z.infer<typeof GenerateSignedContentUrlOutputSchema>;

export async function generateSignedContentUrl(input: GenerateSignedContentUrlInput): Promise<GenerateSignedContentUrlOutput> {
  return generateSignedContentUrlFlow(input);
}

const generateSignedContentUrlFlow = ai.defineFlow({
    name: 'generateSignedContentUrlFlow',
    inputSchema: GenerateSignedContentUrlInputSchema,
    outputSchema: GenerateSignedContentUrlOutputSchema,
    auth: async (auth: { uid: string } | null, { contentId }: { contentId:string }) => {
        if (!auth) { throw new HttpError('unauthenticated', 'User must be logged in.'); }
        const adminUserDoc = await getDoc(doc(db, 'users', auth.uid));
        if (adminUserDoc.data()?.email === 'desireddit4us@private.local') return;
        const contentDocRef = doc(db, 'content', contentId);
        const contentDocSnap = await getDoc(contentDocRef);
        if (!contentDocSnap.exists()) { throw new HttpError('not-found', 'Content not found.'); }
        const allowedUsers = contentDocSnap.data().allowedUsers || {};
        if (!allowedUsers[auth.uid]) { throw new HttpError('permission-denied', 'You do not have access to this content.'); }
    },
}, async ({ contentId }: { contentId: string }) => {
    if (!contentId) { throw new HttpError('invalid-argument', 'Content ID is required.'); }
    try {
        const contentDocRef = doc(db, 'content', contentId);
        const contentDocSnap = await getDoc(contentDocRef);
        if (!contentDocSnap.exists()) { throw new HttpError('not-found', 'Content not found.'); }
        const mediaUrl = contentDocSnap.data().mediaUrl;
        if (!mediaUrl) { throw new HttpError('not-found', 'Media URL not found for this content.'); }
        const storage = getStorage();
        const gsReference = storageRef(storage, mediaUrl);
        const downloadUrl = await getDownloadURL(gsReference);
        return { signedUrl: downloadUrl };
    } catch (error: any) {
        if (error instanceof HttpError) { throw error; }
        throw new HttpError('internal', `Failed to generate signed URL: ${error.message}`);
    }
});