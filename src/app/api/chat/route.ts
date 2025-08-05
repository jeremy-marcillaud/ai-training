import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
  appendResponseMessages,
} from "ai";
import { model } from "~/model";
import { searchSerper } from "~/serper";
import { z } from "zod";
import { auth } from "~/server/auth";
import { checkRateLimit, recordRequest } from "~/server/rate-limit";
import { upsertChat, type ChatWithUserAndMessages } from "~/server/db/queries/chat-queries";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { chats } from "~/server/db/schema";

export const maxDuration = 60;

export async function POST(request: Request) {

  const body = (await request.json()) as {
    messages: Array<Message>;
    chatId?: string;
  };

  // Get user session
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }



  // Rate limit check
  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    return new Response("Too Many Requests", { status: 429 });
  }
  await recordRequest(userId);

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages, chatId } = body;
      
      if(!messages.length){
        throw new Error("No messages provided");
      }

      let currentChatId = chatId;
      if(!currentChatId){
        const newChatId = crypto.randomUUID();
        const title = messages[messages.length - 1]!.content.slice(0, 100) + '...';
        
        await upsertChat({
          chatId: newChatId,
          userId,
          title,
          messages,
        })
        currentChatId = newChatId;
      }else {
        const chat = await db.query.chats.findFirst({
          where: eq(chats.id, currentChatId),
        });
        if(!chat || chat.userId !== userId){
          throw new Response("Unauthorized", { status: 404 });
        }
      }


      if(!chatId){
        dataStream.writeData({
          type: "NEW_CHAT_CREATED",
          chatId: currentChatId,
        })
      }

      const result = streamText({
        model,
        messages,
        system: `You are an AI assistant with access to a web search tool. Follow these steps for every user query:
1. Always call the searchWeb tool with a relevant search query, even if you think you know the answer.
2. ALWAYS format URLs in markdown link [title](url) format,
3. Carefully read the results from the searchWeb tool.
4. Use the information from the search results to compose your response.
5. Always cite your sources with inline markdown links in your answers. For each fact or claim, include a markdown link to the relevant source from the search results.
6. Ensure your response is clear, accurate, and helpful.`,  
        maxSteps: 10,
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
            }),
            execute: async ({ query }, { abortSignal }) => {
              const results = await searchSerper(
                { q: query, num: 10 },
                abortSignal,
              );
              return results.organic.map((result) => ({
                title: `[${result.title}](${result.link})`,
                link: result.link,
                snippet: result.snippet,
              }));
            },
          },
        },
        onFinish: async (result) => {
          const responseMessages = result.response.messages;

          const updateMessages = appendResponseMessages({
            messages,
            responseMessages,
          })

          const lastMessage = updateMessages[updateMessages.length - 1]!;

          if(!lastMessage){
            return;
          }

          await upsertChat({
            userId: session.user.id,
            chatId: currentChatId,
            title: messages[messages.length - 1]!.content.slice(0, 50) + "...",
            messages: updateMessages,
          });

        }
      });

      result.mergeIntoDataStream(dataStream, {
        sendSources: true,
      });
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}