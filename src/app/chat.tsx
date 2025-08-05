"use client";

import { ChatMessage } from "~/components/chat-message";
import { SignInModal } from "~/components/sign-in-modal";
import { useChat, type Message } from "@ai-sdk/react";
import { Square } from "lucide-react";
import { useEffect, useState } from "react";

import { isNewChatCreated } from "~/utils";
import { useRouter } from "next/navigation";


interface ChatProps {
  userName: string;
  isAuthenticated: boolean;
  chatId: string;
  initialMessages: Message[];
  isNewChat: boolean
}

export const ChatPage = ({ userName, isAuthenticated, chatId, initialMessages, isNewChat }: ChatProps) => {


  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    data
  } = useChat({
    initialMessages,
    body: {
      chatId,
      isNewChat
    }
  });

  
  
  
  useEffect(() => {
    const lastDataItem = data?.[data.length - 1];

    if(lastDataItem && isNewChatCreated(lastDataItem)){ 
      router.push(`?id=${lastDataItem.chatId}`);
    }


  }, [data])

  const handleFormSubmit = (e: React.FormEvent) => {

    e.preventDefault();
    if (!isAuthenticated) {
      setShowSignIn(true);
      return;
    }
    handleSubmit(e);
  };

  const handleStop = () => {
    console.log("stop");
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div
          className="mx-auto w-full max-w-[65ch] flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
          role="log"
          aria-label="Chat messages"
        >
          {messages.map((message, index) => {
            return (
              <ChatMessage
                key={index}
                parts={message.parts}
                role={message.role}
                userName={userName}
              />
            );
          })}
        </div>

        <div className="border-t border-gray-700">
          <form
            onSubmit={handleFormSubmit}
            className="mx-auto max-w-[65ch] p-4"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Say something..."
                autoFocus
                aria-label="Chat input"
                className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-gray-200 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={isLoading ? handleStop : handleFormSubmit}
                disabled={false}
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:hover:bg-gray-700"
              >
                {isLoading ? <Square className="size-4" /> : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
};
