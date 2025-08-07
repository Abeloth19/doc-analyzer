"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Bot, User, AlertCircle, X } from "lucide-react"; 
import api from "@/lib/api";


interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface DocumentData {
  success: boolean;
  text: string;
  chunks: string[];
  fileName: string;
}

interface ChatResponse {
  answer: string;
  relevantChunks: number;
}

interface ApiError {
  code?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message?: string;
}

interface ChatInterfaceProps {
  documentData: DocumentData | null; 
}

export default function ChatInterface({ documentData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

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
      const response = await api.post<ChatResponse>("/api/chat", {
        question: currentInput,
        documentText: documentData?.text,
        chunks: documentData?.chunks,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          response.data.answer || "Sorry, I could not process your question.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      
      const apiError = error as ApiError;
      console.error("Error sending message:", apiError);

      let errorMessage = "Sorry, there was an error processing your question.";

      if (apiError.code === "ECONNABORTED") {
        errorMessage =
          "Request timeout. Please try again with a shorter question.";
      } else if (apiError.response?.status === 429) {
        errorMessage =
          "Too many requests. Please wait a moment before trying again.";
      } else if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }

      setError(errorMessage);

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
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

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Upload a document to start asking questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
     
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Ask about your document</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 truncate max-w-xs">
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

    
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start by asking a question about your document</p>
            <p className="text-sm mt-2">
              For example: &ldquo;What is the main topic?&rdquo; or
              &ldquo;Summarize this document&rdquo;
            </p>

      
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
                    onClick={() => setInputValue(suggestion)}
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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
