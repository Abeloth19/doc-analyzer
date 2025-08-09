"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageCircle,
  Bot,
  User,
  AlertCircle,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    modelUsed?: string;
    processingTime?: number;
  };
}

interface DocumentData {
  success: boolean;
  text: string;
  chunks: string[];
  fileName: string;
}

interface ChatResponse {
  answer: string;
  modelUsed?: string;
  processingTime?: number;
  relevantChunks?: number;
}

interface ChatInterfaceProps {
  documentData: DocumentData | null;
}

export default function ChatInterface({ documentData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return <br key={`br-${index}`} />;
      }
      if (trimmedLine.startsWith("### ")) {
        const text = trimmedLine.replace("### ", "");
        return (
          <h3
            key={`h3-${index}`}
            className="text-lg font-bold text-gray-900 mt-3 mb-2"
          >
            {parseInline(text)}
          </h3>
        );
      } else if (trimmedLine.startsWith("## ")) {
        const text = trimmedLine.replace("## ", "");
        return (
          <h2
            key={`h2-${index}`}
            className="text-xl font-bold text-gray-900 mt-3 mb-2"
          >
            {parseInline(text)}
          </h2>
        );
      } else if (trimmedLine.startsWith("# ")) {
        const text = trimmedLine.replace("# ", "");
        return (
          <h1
            key={`h1-${index}`}
            className="text-2xl font-bold text-gray-900 mt-3 mb-2"
          >
            {parseInline(text)}
          </h1>
        );
      }
   
      else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        const text = trimmedLine.replace(/^[*-] /, "");
        return (
          <div
            key={`bullet-${index}`}
            className="flex items-start space-x-2 mb-1"
          >
            <span className="text-blue-600 font-bold mt-1">•</span>
            <span className="text-gray-700">{parseInline(text)}</span>
          </div>
        );
      }
        else if (/^\d+\. /.test(trimmedLine)) {
        const text = trimmedLine.replace(/^\d+\. /, "");
        const number = trimmedLine.match(/^(\d+)\./)?.[1];
        return (
          <div
            key={`number-${index}`}
            className="flex items-start space-x-2 mb-1"
          >
            <span className="text-blue-600 font-bold mt-1">{number}.</span>
            <span className="text-gray-700">{parseInline(text)}</span>
          </div>
        );
      }

      else {
        return (
          <p key={`p-${index}`} className="text-gray-700 mb-2">
            {parseInline(trimmedLine)}
          </p>
        );
      }
    });
  };

  const parseInline = (text: string) => {

    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Bold text
        return (
          <strong key={`bold-${index}`} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (
        part.startsWith("*") &&
        part.endsWith("*") &&
        !part.startsWith("**")
      ) {
        // Italic text
        return (
          <em key={`italic-${index}`} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        // Inline code
        return (
          <code
            key={`code-${index}`}
            className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else {
        // Regular text
        return part;
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!documentData) {
      setError("Please upload a document first");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentInput,
          documentText: documentData.text,
          chunks: documentData.chunks,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to get response";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          if (response.status === 503) {
            setIsConnected(false);
            errorMessage =
              "🔌 Python AI backend is not running. Please start the Python server:\n\n```\npython main.py\n```";
          } else if (response.status === 408) {
            errorMessage =
              "⏰ Request timeout. The AI model took too long to respond. Please try a shorter question.";
          }
        } catch {
          if (response.status === 503) {
            setIsConnected(false);
            errorMessage =
              "🔌 Cannot connect to AI backend. Please ensure Python server is running.";
          }
        }

        throw new Error(errorMessage);
      }

      const data: ChatResponse = await response.json();
      setIsConnected(true);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || "Sorry, I could not process your question.",
        isUser: false,
        timestamp: new Date(),
        metadata: {
          modelUsed: data.modelUsed,
          processingTime: data.processingTime,
        },
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Chat error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Sorry, there was an error processing your question.";

      setError(errorMessage);

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ **Error**: ${errorMessage}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const insertSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Upload a document to start asking questions</p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">AI Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">AI Backend Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Ask about your document</h3>
          <div className="flex items-center space-x-1">
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="text-sm text-gray-500 truncate max-w-xs"
            title={documentData.fileName}
          >
            {documentData.fileName}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear conversation"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800 transition-colors"
            type="button"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start by asking a question about your document</p>
            <p className="text-sm mt-2">
              For example: &ldquo;What is the main topic?&rdquo; or
              &ldquo;Summarize this document&rdquo;
            </p>

            {/* Suggested Questions */}
            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Suggested Questions
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "What is this document about?",
                  "Summarize the key points",
                  "What are the main conclusions?",
                  "List the important dates",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => insertSuggestion(suggestion)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 chat-message ${
                message.isUser ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isUser ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                {message.isUser ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-gray-600" />
                )}
              </div>

              <div
                className={`flex-1 max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.isUser ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg shadow-sm ${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.isUser ? (
                    // User messages - simple text
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.text}
                    </p>
                  ) : (
                    // Bot messages - parse markdown
                    <div className="text-sm leading-relaxed">
                      {parseMarkdown(message.text)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1 px-1">
                  <p className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  {/* Show model info for bot messages */}
                  {!message.isUser && message.metadata?.modelUsed && (
                    <p className="text-xs text-gray-400 ml-2">
                      {message.metadata.modelUsed.split("/").pop()}
                      {message.metadata.processingTime &&
                        ` • ${message.metadata.processingTime.toFixed(1)}s`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 bg-gray-100 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 bg-gray-50"
      >
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your document..."
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
              maxLength={500}
              autoComplete="off"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {inputValue.length}/500 characters
          </div>
          <div className="text-xs text-gray-400">Press Enter to send</div>
        </div>
      </form>
    </div>
  );
}
