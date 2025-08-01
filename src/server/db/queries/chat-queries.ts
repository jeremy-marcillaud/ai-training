
import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { chats, messages } from "../schema";
import type { Message } from "ai";

/**
 * The type returned by getChat, including user and messages relations.
 */
export type ChatWithUserAndMessages = Awaited<
  ReturnType<typeof db.query.chats.findFirst>
>;



/**
 * Fetch a chat by its id, including its user and messages.
 * @param id The chat id
 * @returns The chat with user and messages, or null if not found
 */
export async function getChat({chatId, userId } : {chatId: string, userId: string}): Promise<ChatWithUserAndMessages | null> {
  const result = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    with: {
      messages: {
        orderBy: (messages, {asc}) => [asc(messages.order)],
      },
    },
  });
  return result ?? null;
}


export async function getChats({userId } : {userId: string}): Promise<ChatWithUserAndMessages[]> {
  const result = await db.query.chats.findMany({
    where: eq(chats.userId, userId),
    with: {
        messages:{
            orderBy: (messages, {desc}) => [desc(chats.updatedAt)],
        },
    },
  });
  return result;
}


export const upsertChat = async (opts: {
    userId: string;
    chatId: string;
    title: string;
    messages: Message[];
  }) => {
    const { userId, chatId, title, messages: newMessages } = opts;
  
    // First, check if the chat exists and belongs to the user
    const existingChat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });
  
    if (existingChat) {
      // If chat exists but belongs to a different user, throw error
      if (existingChat.userId !== userId) {
        throw new Error("Chat ID already exists under a different user");
      }
      // Delete all existing messages
      await db.delete(messages).where(eq(messages.chatId, chatId));
    } else {
      // Create new chat
      await db.insert(chats).values({
        id: chatId,
        userId,
        title,
      });
    }
  
    // Insert all messages
  await db.insert(messages).values(
    newMessages.map((message: Message, index: number) => ({
      id: crypto.randomUUID(),
      chatId,
      role: message.role,
      parts: message.parts,
      order: index,
    })),
  );

  return { id: chatId }
}