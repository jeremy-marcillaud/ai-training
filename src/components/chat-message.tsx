import ReactMarkdown, { type Components } from "react-markdown";
import type { Message } from "ai";

export type MessagePart = NonNullable<
  Message["parts"]
>[number];

interface ChatMessageProps {
  parts?: MessagePart[];
  role: string;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const ToolInvocation = ({ part }: { part: MessagePart }) => {
  if (part.type !== "tool-invocation") return null;

  const { toolInvocation } = part;

  return (
    <div className="mb-4 rounded-lg border border-gray-600 bg-gray-700 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-blue-400">
          🔧 {toolInvocation.toolName}
        </span>
        <span className="text-xs text-gray-400">
          {toolInvocation.state === "partial-call" && "Calling..."}
          {toolInvocation.state === "call" && "Called"}
          {toolInvocation.state === "result" && "Completed"}
        </span>
      </div>

      {toolInvocation.state === "call" || toolInvocation.state === "result" ? (
        <div className="mb-2">
          <div className="text-xs text-gray-400">Arguments:</div>
          <pre className="mt-1 rounded bg-gray-800 p-2 text-xs">
            {JSON.stringify(toolInvocation.args, null, 2)}
          </pre>
        </div>
      ) : null}

      {toolInvocation.state === "result" && "result" in toolInvocation ? (
        <div>
          <div className="text-xs text-gray-400">Results:</div>
          <div className="mt-1 space-y-2">
            {Array.isArray(toolInvocation.result) ? (
              toolInvocation.result.map((item, index) => (
                <div key={index} className="rounded bg-gray-800 p-2 text-sm">
                  <div className="font-medium text-blue-300">{item.title}</div>
                  <div className="text-gray-300">{item.snippet}</div>
                </div>
              ))
            ) : (
              <pre className="rounded bg-gray-800 p-2 text-xs">
                {JSON.stringify(toolInvocation.result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Source = ({ part }: { part: MessagePart }) => {
  if (part.type !== "source") return null;
  const { source } = part;
  return (
    <div className="mb-2 rounded border border-blue-700 bg-blue-950 p-2 text-xs">
      <span className="font-semibold text-blue-300">Source: </span>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline"
      >
        {source.title ? source.title : source.url}
      </a>
      {typeof source.providerMetadata?.provider === "string" && (
        <span className="ml-2 text-gray-400">
          ({source.providerMetadata.provider})
        </span>
      )}
    </div>
  );
};

export const ChatMessage = ({ parts, role, userName }: ChatMessageProps) => {
  const isAI = role === "assistant";

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>
        <div className="prose prose-invert max-w-none">
          {/* Hover over each MessagePart to see all possible types! */}
          {parts?.map((part, index) => {
            if (part.type === "text") {
              return <Markdown key={index}>{part.text}</Markdown>;
            }
            if (part.type === "tool-invocation") {
              return <ToolInvocation key={index} part={part} />;
            }
            if (part.type === "source") {
              return <Source key={index} part={part} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};
