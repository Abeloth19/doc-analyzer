export const config = {
  app: {
    name: "DocAnalyzer AI",
    version: "2.0.0",
    description: "Intelligent Document Analysis with Python AI Backend",
    maxFileSize: 5 * 1024 * 1024, // 5MB for text files
    supportedFormats: ["text/plain"],
    frontend_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  api: {
    python_backend_url: process.env.PYTHON_API_URL || "http://127.0.0.1:8000",
    timeout: 45000, 
    health_check_timeout: 10000, 
  },

  features: {
    pdf_support: false, 
    python_backend: true, 
    real_time_processing: true,
    chunking_enabled: true,
    max_chunk_size: 500,
  },

  development: {
    frontend_port: 3000,
    python_api_port: 8000,
    auto_reload: true,
  },
};
