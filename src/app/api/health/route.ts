import { NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";


interface NextJSStatus {
  status: string;
  environment: string;
  uptime: number;
}

interface PythonApiStatus {
  status: string;
  url: string;
  available: boolean;
  models: string[];
  error: string | null;
  huggingface_available?: boolean;
  python_version?: string;
}

interface ServicesStatus {
  nextjs: NextJSStatus;
  python_api: PythonApiStatus;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  services: ServicesStatus;
  responseTime: number;
}

interface PythonHealthResponse {
  status?: string;
  models_loaded?: string[];
  huggingface_available?: boolean;
  python_api?: string;
}

export async function GET() {
  const startTime = Date.now();

  const healthCheck: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      nextjs: {
        status: "running",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
      },
      python_api: {
        status: "unknown",
        url: PYTHON_API_URL,
        available: false,
        models: [],
        error: null,
      },
    },
    responseTime: 0,
  };


  try {

    const pythonResponse = await fetch(`${PYTHON_API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (pythonResponse.ok) {
      const pythonHealth: PythonHealthResponse = await pythonResponse.json();

      healthCheck.services.python_api = {
        status: pythonHealth.status || "running",
        url: PYTHON_API_URL,
        available: true,
        models: pythonHealth.models_loaded || [],
        error: null,
        huggingface_available: pythonHealth.huggingface_available,
        python_version: pythonHealth.python_api,
      };

    } else {
      throw new Error(`Python API returned ${pythonResponse.status}`);
    }
  } catch (pythonError) {
    console.warn("⚠️ Python API health check failed:", pythonError);

    healthCheck.services.python_api = {
      status: "down",
      url: PYTHON_API_URL,
      available: false,
      models: [],
      error:
        pythonError instanceof Error
          ? pythonError.message
          : String(pythonError),
    };

    healthCheck.status = "degraded";
  }

  healthCheck.responseTime = Date.now() - startTime;

  if (healthCheck.services.python_api.available) {
    healthCheck.status = "healthy";
  } else {
    healthCheck.status = "degraded";
  }

  return NextResponse.json(healthCheck);
}
