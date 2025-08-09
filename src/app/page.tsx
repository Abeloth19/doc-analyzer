"use client";

import { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import ChatInterface from "@/components/ChatInterface";
import {
  Brain,
  FileText,
  MessageCircle,
  Zap,
} from "lucide-react";
import api from "@/lib/api";

interface DocumentData {
  success: boolean;
  text: string;
  chunks: string[];
  fileName: string;
}

interface HealthStatus {
  status: string;
  services: {
    openai: boolean;
    huggingface: boolean;
  };
}

export default function Home() {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get<HealthStatus>("/api/health");
        setHealthStatus(response.data);

      } catch (error) {
        console.error("Health check failed:", error);
      }
    };

    checkHealth();
  }, []);

  const handleFileProcessed = (data: DocumentData | null) => {
    setDocumentData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  DocAnalyzer AI
                </h1>
                <p className="text-sm text-gray-600">
                  Intelligent Document Analysis & Q&A System
                </p>
              </div>
            </div>

            {/* Health Status Indicator */}
            {healthStatus && (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthStatus.status === "healthy"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {healthStatus.status === "healthy"
                    ? "Services Online"
                    : "Service Issues"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!documentData && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Analyze Documents with AI
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Upload your PDF or text documents and ask questions to get instant
              insights
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Smart Extraction
                </h3>
                <p className="text-sm text-gray-600">
                  Advanced PDF and text processing with intelligent content
                  extraction using axios-powered APIs
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Natural Q&A
                </h3>
                <p className="text-sm text-gray-600">
                  Ask questions in natural language and get accurate answers
                  powered by AI
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Instant Results
                </h3>
                <p className="text-sm text-gray-600">
                  Get immediate insights with robust error handling and retry
                  mechanisms
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center space-x-8 text-sm text-gray-500 mb-8">
              <div className="text-center">
                <div className="font-semibold text-gray-900">10MB</div>
                <div>Max File Size</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">PDF & TXT</div>
                <div>Supported Formats</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">AI Powered</div>
                <div>Smart Analysis</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Step 1: Upload Document
              </h3>
              <p className="text-gray-600 text-sm">
                Choose a PDF or text file to analyze (processed securely with
                axios)
              </p>
            </div>

            <div className="p-6">
              <FileUpload
                onFileProcessed={handleFileProcessed}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />

              {documentData && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800 mb-2">
                        📄 Document processed successfully!
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">File:</span>
                          <span className="truncate">
                            {documentData.fileName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Size:</span>
                          <span>
                            {documentData.text?.length.toLocaleString()}{" "}
                            characters
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Chunks:</span>
                          <span>{documentData.chunks?.length} sections</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Step 2: Ask Questions
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Chat with your document to get insights and answers
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <ChatInterface documentData={documentData} />
            </div>
          </div>

          {documentData && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">
                💡 Pro Tips for Better Results
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p>
                    <strong>Specific Questions:</strong> Ask about particular
                    topics, dates, or concepts
                  </p>
                  <p>
                    <strong>Example:</strong> What are the key findings in
                    section 3?
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Summarization:</strong> Request summaries of
                    specific sections
                  </p>
                  <p>
                    <strong>Example:</strong> Summarize the main conclusions
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>
                Built with Next.js, TypeScript, Axios and AI • Open Source
                Project
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>Version 1.0.0</span>
              {healthStatus && <span>Status: {healthStatus.status}</span>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
