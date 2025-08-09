# 📄 Document Analyzer

An intelligent document analysis application that allows users to upload text documents and ask questions about their content using AI-powered natural language processing.

## ✨ Features

- **📁 Document Upload**: Support for `.txt` files with smart text chunking
- **🤖 AI-Powered Q&A**: Ask questions about your documents using multiple language models
- **🎨 Markdown Support**: Rich formatting in AI responses (headings, bullets, bold text)
- **⚡ Real-time Processing**: Instant responses with automatic model fallback
- **📱 Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

**Frontend**: Next.js 15.4.6, TypeScript, Tailwind CSS 3.4.17  
**Backend**: Python 3.9+, FastAPI, HuggingFace Hub  
**AI Models**: DeepSeek V3, Meta Llama 3.x, Qwen 2.5, Mistral, Gemma

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ and pip
- HuggingFace account (free)

### Installation

1. **Clone and install dependencies**
```bash
git clone <your-repo-url>
cd doc-analyzer
npm install
npm run python:install
```

2. **Setup HuggingFace API**
- Get your token: https://huggingface.co/settings/tokens
- Create `python-api/.env`:
```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

3. **Start the application**
```bash
npm run dev:full
```

4. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📖 How to Use

1. **Upload Document**: Select a `.txt` file (max 5MB)
2. **Ask Questions**: Type questions like "What is this document about?" or "Summarize the key points"
3. **Get AI Responses**: Receive formatted answers with markdown support

## 📁 Project Structure

```
doc-analyzer/
├── src/
│   ├── app/api/          # Next.js API routes
│   ├── components/       # React components
│   └── lib/             # Utilities
├── python-api/
│   ├── main.py          # FastAPI server
│   ├── models.py        # HuggingFace integration
│   └── requirements.txt # Python dependencies
└── start-dev.js        # Development launcher
```

## 🤖 AI Models

The system automatically tries these models in order:
1. **DeepSeek V3** - Primary model for best responses
2. **Meta Llama 3.1** - Reliable backup option
3. **Qwen 2.5** - Alternative processing
4. **Mistral & Gemma** - Additional fallbacks

## 📡 API Endpoints

```http
POST /api/upload    # Upload document
POST /api/chat      # Ask questions
GET  /api/health    # System status
```

## 🔧 Available Scripts

```bash
npm run dev:full         # Start both frontend & backend
npm run dev              # Start Next.js only
npm run python:dev       # Start Python API only
npm run build            # Build for production
```

## 🚨 Troubleshooting

**"Python API not running"**
```bash
cd python-api && python main.py
```

**"HuggingFace API error"**
- Check your API key in `python-api/.env`
- Ensure token has "Inference API" permissions

**"File upload failed"**
- Only `.txt` files supported
- Maximum size: 5MB
- File must contain actual text

**"All AI models failed"**
- Check internet connection
- Verify HuggingFace API key
- Wait 30-60 seconds and try again (rate limiting)