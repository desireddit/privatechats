
'use server';
/**
 * @fileOverview A flow to send a message in a chat.
 *
 * - sendMessage - A function that adds a message to a chat conversation.
 * - SendMessageInput - The input type for the sendMessage function.
 * - SendMessageOutput - The return type for the sendMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';


const SendMessageInputSchema = z.object({
  chatId: z.string().describe('The ID of the chat to send the message to.'),
  senderId: z.string().describe('The ID of the message sender.'),
  body: z.string().describe('The content of the message.'),
  senderRole: z.enum(['user', 'admin']).describe('The role of the sender.'),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

const SendMessageOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  messageId: z.string().optional().describe('The ID of the sent message.'),
});
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;

export async function sendMessage(input: SendMessageInput): Promise<SendMessageOutput> {
  return sendMessageFlow(input);
}

const sendMessageFlow = ai.defineFlow(
  {
    name: 'sendMessageFlow',
    inputSchema: SendMessageInputSchema,
    outputSchema: SendMessageOutputSchema,
  },
  async ({ chatId, senderId, body, senderRole }) => {
    
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== senderId) {
        throw new Error("Unauthorized: You can only send messages as yourself.");
    }
    
    if (!body.trim()) {
      throw new Error('Message body cannot be empty.');
    }

    try {
      const messagesColRef = collection(db, 'messages', chatId, 'messages');
      const docRef = await addDoc(messagesColRef, {
        senderId,
        senderRole,
        body,
        type: 'text',
        createdAt: serverTimestamp(),
      });
      return { success: true, messageId: docRef.id };
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
);
