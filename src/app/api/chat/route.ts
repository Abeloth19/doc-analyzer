import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, documentText, chunks } = body;

    if (!question || !documentText) {
      return NextResponse.json(
        { error: "Missing question or document" },
        { status: 400 }
      );
    }


    try {

      const healthResponse = await fetch(`${PYTHON_API_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!healthResponse.ok) {
        return NextResponse.json(
          {
            error: "Python AI service is not available",
            details: `Health check failed with status ${healthResponse.status}`,
            instructions: [
              "The Python backend for AI processing is not running.",
              "Please start it by running: npm run python:dev",
              "Or check if it's running on http://127.0.0.1:8000",
            ],
          },
          { status: 503 }
        );
      }

      const healthData = await healthResponse.json();

      if (!healthData.huggingface_available) {
        return NextResponse.json(
          {
            error: "HuggingFace service not configured in Python API",
            details: healthData,
            instructions: [
              "The Python API is running but HuggingFace is not configured.",
              "Please set HUGGINGFACE_API_KEY in python-api/.env",
              "Get a token from: https://huggingface.co/settings/tokens",
            ],
          },
          { status: 503 }
        );
      }
    } catch (healthError) {
      return NextResponse.json(
        {
          error: "Cannot connect to Python AI service",
          details:
            healthError instanceof Error
              ? healthError.message
              : String(healthError),
          instructions: [
            "The Python backend is not running or not accessible.",
            "Please start it by running: npm run python:dev",
            "Make sure it's running on http://127.0.0.1:8000",
            "Check the terminal for Python API startup messages",
          ],
        },
        { status: 503 }
      );
    }

    // Call Python API for AI processing
    try {
      const pythonResponse = await fetch(`${PYTHON_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          document_text: documentText,
          chunks: chunks || [],
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json().catch(() => ({}));

        return NextResponse.json(
          {
            error: "AI processing failed",
            details:
              errorData.detail ||
              `Python API returned ${pythonResponse.status}`,
            pythonError: errorData,
          },
          { status: pythonResponse.status }
        );
      }

      const aiResponse = await pythonResponse.json();

      return NextResponse.json({
        answer: aiResponse.answer,
        relevantChunks: aiResponse.relevant_chunks,
        model: aiResponse.model_used,
        processingTime: aiResponse.processing_time,
        backend: "python",
        timestamp: new Date().toISOString(),
      });
    } catch (aiError) {
      if (aiError instanceof Error && aiError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "AI processing timeout",
            details:
              "The AI took too long to respond. This can happen when models are loading.",
            suggestion: "Please try again in 30-60 seconds.",
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          error: "AI processing failed",
          details: aiError instanceof Error ? aiError.message : String(aiError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your question",
        debug: {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : typeof error,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
