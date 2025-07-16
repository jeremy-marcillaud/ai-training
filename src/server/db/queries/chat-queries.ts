
import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { chats, messages } from "../schema";

/**
 * The type returned by getChat, including user and messages relations.
 */
export type ChatWithUserAndMessages = Awaited<
  ReturnType<typeof db.query.chats.findFirst>
>;

export type Message = Awaited<
  ReturnType<typeof db.query.messages.findFirst>
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


export async function upsertChat({ chatId, userId, title, messages: newMessages } : {chatId: string, userId: string, title: string, messages: Message[]}): Promise<void> {
  const existingChat=  await db.query.chats.findFirst({
        where: eq(chats.id, chatId),
    })

    if(existingChat){
        if(existingChat.userId !== userId){
            throw new Error("You are not authorized to update this chat");
        }
        await db.delete(messages).where(eq(messages.chatId, chatId));
    } else {
        await db.insert(chats).values({
            id: chatId,
            userId,
            title,
        });
    }

 
}
