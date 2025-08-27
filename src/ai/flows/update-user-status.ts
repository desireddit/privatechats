
'use server';
/**
 * @fileOverview A flow to update a user's status in Firestore.
 *
 * - updateUserStatus - A function that updates the status of a user.
 * - UpdateUserStatusInput - The input type for the updateUserStatus function.
 * - UpdateUserStatusOutput - The return type for the updateUserStatus function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const UpdateUserStatusInputSchema = z.object({
  userId: z.string().describe('The ID of the user to update.'),
  status: z.enum(['pending', 'verified', 'blocked']).describe('The new status for the user.'),
});
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusInputSchema>;

const UpdateUserStatusOutputSchema = z.object({
  success: z.boolean().describe('Whether the update was successful.'),
  message: z.string().describe('A message describing the result.'),
});
export type UpdateUserStatusOutput = z.infer<typeof UpdateUserStatusOutputSchema>;

// IMPORTANT: In a production environment, you must secure this flow.
// This flow should only be callable by an authenticated admin user.
// You would typically do this by checking for a custom claim on the user's ID token.
// Example:
// if (!context.auth?.token.admin) {
//   throw new HttpsError('permission-denied', 'Must be an admin to call this function');
// }

export async function updateUserStatus(input: UpdateUserStatusInput): Promise<UpdateUserStatusOutput> {
  return updateUserStatusFlow(input);
}

const updateUserStatusFlow = ai.defineFlow(
  {
    name: 'updateUserStatusFlow',
    inputSchema: UpdateUserStatusInputSchema,
    outputSchema: UpdateUserStatusOutputSchema,
  },
  async ({ userId, status }) => {
    if (!userId || !status) {
      throw new Error('User ID and new status are required.');
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        status: status,
      });
      return { success: true, message: `User ${userId} status updated to ${status}.` };
    } catch (error: any) {
      console.error("Error updating user status:", error);
      throw new Error(`Failed to update user status: ${error.message}`);
    }
  }
);
