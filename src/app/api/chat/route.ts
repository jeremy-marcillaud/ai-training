import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
} from "ai";
import { model } from "~/model";
import { searchSerper } from "~/serper";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

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
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}