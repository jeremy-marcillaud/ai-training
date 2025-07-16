
import { eq } from "drizzle-orm";
import { db } from "../index";
import { chats } from "../schema";

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
export async function getChat({id } : {id: string}): Promise<ChatWithUserAndMessages | null> {
  const result = await db.query.chats.findFirst({
    where: eq(chats.id, id),
    with: {
      user: true,
      messages: true,
    },
  });
  return result ?? null;
}


export async function getChats({userId } : {userId: string}): Promise<ChatWithUserAndMessages[]> {
  const result = await db.query.chats.findMany({
    where: eq(chats.userId, userId),
    with: {
      user: true,
      messages: true,
    },
  });
  return result;
}


export async function upsertChat({ id, userId } : {id: string, userId: string}): Promise<void> {
    await db.insert(chats)
  .values({
    id,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: chats.id,
    set: {
      userId,
      updatedAt: new Date(),
    },
  });
}
