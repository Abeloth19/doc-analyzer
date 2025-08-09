from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import uvicorn
from models import HuggingFaceClient

# Load environment variables
load_dotenv()

app = FastAPI(title="DocAnalyzer Python API", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize HuggingFace client
hf_client = HuggingFaceClient()

class ChatRequest(BaseModel):
    question: str
    document_text: str
    chunks: Optional[List[str]] = []

class ChatResponse(BaseModel):
    answer: str
    model_used: str
    processing_time: float
    relevant_chunks: int

class HealthResponse(BaseModel):
    status: str
    python_api: str
    huggingface_available: bool
    models_loaded: List[str]

@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "DocAnalyzer Python API is running!",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "chat": "/chat",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        models_status = await hf_client.check_models()
        
        return HealthResponse(
            status="healthy",
            python_api="running",
            huggingface_available=hf_client.is_available(),
            models_loaded=models_status
        )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            python_api="running",
            huggingface_available=False,
            models_loaded=[]
        )

@app.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """Process chat request with document context"""
    try:
        print(f"🐍 Python API: Processing question: {request.question[:50]}...")
        print(f"📄 Document length: {len(request.document_text)} chars")
        print(f"🔗 Chunks provided: {len(request.chunks)}")
        
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not request.document_text.strip():
            raise HTTPException(status_code=400, detail="Document text cannot be empty")
        
        # Process with HuggingFace
        result = await hf_client.generate_response(
            question=request.question,
            document_text=request.document_text,
            chunks=request.chunks
        )
        
        print(f"✅ Python API: Response generated successfully")
        
        return ChatResponse(
            answer=result["answer"],
            model_used=result["model"],
            processing_time=result["processing_time"],
            relevant_chunks=len(request.chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Python API Error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/models")
async def list_available_models():
    """List available HuggingFace models"""
    try:
        models = await hf_client.list_models()
        return {"available_models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🐍 Starting DocAnalyzer Python API...")
    print("🔗 Frontend should be running on http://localhost:3000")
    print("🐍 Python API will run on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )