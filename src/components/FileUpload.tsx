"use client";

import { useState, useCallback } from "react";
import { Upload, X, AlertCircle, FileText, Copy } from "lucide-react";

interface DocumentData {
  success: boolean;
  text: string;
  chunks: string[];
  fileName: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  chunkCount: number;
  processingMethod: string;
  message: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
      suggestion?: string;
      instructions?: string[];
      fileType?: string;
    };
  };
  code?: string;
  message?: string;
}

interface FileUploadProps {
  onFileProcessed: (data: DocumentData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function FileUpload({
  onFileProcessed,
  isLoading,
  setIsLoading,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // Immediate validation for file type
      if (file.type !== "text/plain") {
        setError(`Only .txt files are supported. Your file type: ${file.type}`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setError(null);
      setUploadedFile(file);
      setIsLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      try {
          const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90; 
            }
            return prev + 10;
          });
        }, 200);


   
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: DocumentData = await response.json();

        if (data.success) {
          onFileProcessed(data);
          setError(null);
        } else {
          setError("Error processing file");
        }
      } catch (error) {
        const apiError = error as ApiError;

        console.error("Upload error details:", {
          message: apiError.message,
          status: apiError.response?.status,
          code: apiError.code,
        });

        let errorMessage = "Error uploading file. Please try again.";

        if (
          apiError.message?.includes("413") ||
          apiError.response?.status === 413
        ) {
          errorMessage =
            "File too large. Please choose a smaller file (max 5MB).";
        } else if (
          apiError.message?.includes("400") ||
          apiError.response?.status === 400
        ) {
          errorMessage = "Invalid file format. Please upload a .txt file.";
        } else if (apiError.code === "TIMEOUT") {
          errorMessage =
            "Upload timeout. Please try again with a smaller file.";
        } else if (apiError.code === "NETWORK_ERROR" || !navigator.onLine) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }

        setError(errorMessage);
        setUploadProgress(0);
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, onFileProcessed]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    onFileProcessed(null);
  }, [onFileProcessed]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Information Banner */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">📝 Text Files Only</p>
            <p className="text-blue-700 mb-2">
              This version supports .txt files only for reliable AI processing
              with our Python backend.
            </p>
            <details className="text-blue-600">
              <summary className="cursor-pointer hover:text-blue-800 font-medium">
                How to convert PDF to text →
              </summary>
              <div className="mt-2 space-y-1 text-sm pl-4">
                <p>1. Open your PDF in any PDF viewer</p>
                <p>2. Select all text (Ctrl+A or Cmd+A)</p>
                <p>3. Copy the text (Ctrl+C or Cmd+C)</p>
                <p>4. Open a text editor (Notepad, TextEdit, etc.)</p>
                <p>5. Paste and save as .txt file</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : "border-gray-300 hover:border-gray-400"
          } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center">
            <Upload
              className={`h-12 w-12 mb-4 ${
                isLoading ? "animate-pulse text-blue-500" : "text-gray-400"
              }`}
            />

            <div className="text-lg font-medium text-gray-700 mb-2">
              {isLoading
                ? "Processing text file..."
                : "Upload your text document"}
            </div>

            <div className="text-sm text-gray-500 mb-3">
              Drag and drop your .txt file here, or click to browse
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>Only .txt files</span>
              </span>
              <span>•</span>
              <span>Max 5MB</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Copy className="h-3 w-3" />
                <span>Copy from PDF</span>
              </span>
            </div>

            {isLoading && (
              <div className="mt-4 w-full max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Processing with Python AI backend... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                {uploadedFile.name}
              </div>
              <div className="text-sm text-green-600">
                {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for AI
                analysis
              </div>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-1 text-green-600 hover:text-green-800 transition-colors"
            type="button"
            title="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Quick Tips */}
      {!uploadedFile && !isLoading && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">💡 Quick tip:</p>
          <p className="text-xs text-gray-400">
            For best results, use clean, well-formatted text files with clear
            paragraphs and sentences.
          </p>
        </div>
      )}
    </div>
  );
}
