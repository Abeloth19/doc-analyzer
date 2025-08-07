"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import api from "@/lib/api";


interface DocumentData {
  success: boolean;
  text: string;
  chunks: string[];
  fileName: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
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

 
  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

   
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

    
      const allowedTypes = ["application/pdf", "text/plain"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF and text files are supported");
        return;
      }

      setError(null);
      setUploadedFile(file);
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await api.post<DocumentData>("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
 
            if (progressEvent.total) {
              console.log(
                "Upload progress:",
                (progressEvent.loaded / progressEvent.total) * 100
              );
            }
          },
        });

        if (response.data.success) {
          onFileProcessed(response.data);
          setError(null);
        } else {
          setError("Error processing file");
        }
      } catch (error) {
        const apiError = error as ApiError;
        console.error("Upload error:", apiError);

        if (apiError.response?.status === 413) {
          setError("File too large. Please choose a smaller file.");
        } else if (apiError.code === "ECONNABORTED") {
          setError("Upload timeout. Please try again with a smaller file.");
        } else {
          setError(
            apiError.response?.data?.error ||
              "Error uploading file. Please try again."
          );
        }
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
    onFileProcessed(null);
  }, [onFileProcessed]);

  return (
    <div className="w-full max-w-2xl mx-auto">
     
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <Upload
            className={`mx-auto h-12 w-12 mb-4 ${
              isLoading ? "animate-pulse" : "text-gray-400"
            }`}
          />

          <div className="text-lg font-medium text-gray-700 mb-2">
            {isLoading ? "Processing document..." : "Upload your document"}
          </div>

          <div className="text-sm text-gray-500">
            Drag and drop your PDF or text file here, or click to browse
          </div>

          <div className="text-xs text-gray-400 mt-2">
            Supported formats: PDF, TXT (Max 10MB)
          </div>

          {isLoading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                {uploadedFile.name}
              </div>
              <div className="text-sm text-green-600">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-1 text-green-600 hover:text-green-800 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
