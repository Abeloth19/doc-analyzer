import os
import time
from typing import List, Dict, Optional

class HuggingFaceClient:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        
        # Working models for 2025 HuggingFace Inference
        self.models = [
            # DeepSeek models (working great!)
            "deepseek-ai/DeepSeek-V3-0324",
            "deepseek-ai/DeepSeek-R1",
            
            # Meta Llama models
            "meta-llama/Llama-3.1-8B-Instruct",
            "meta-llama/Llama-3.3-70B-Instruct", 
            "meta-llama/Meta-Llama-3-8B-Instruct",
            
            # Qwen models
            "Qwen/Qwen2.5-72B-Instruct",
            "Qwen/Qwen2.5-7B-Instruct",
            "Qwen/Qwen2.5-3B-Instruct",
            
            # Mistral models
            "mistralai/Mistral-7B-Instruct-v0.3",
            "mistralai/Mistral-Nemo-Instruct-2407",
            
            # Google Gemma
            "google/gemma-2-9b-it",
            "google/gemma-2-2b-it",
        ]
        
        print(f"🤗 HuggingFace Client initialized (Clean Version)")
        print(f"🔑 API Key available: {bool(self.api_key and self.api_key.startswith('hf_'))}")
        if self.api_key:
            print(f"🔑 API Key starts with: {self.api_key[:8]}...")
        else:
            print("❌ No HuggingFace API key found in environment!")
            print("💡 Get your token from: https://huggingface.co/settings/tokens")
    
    def is_available(self) -> bool:
        """Check if HuggingFace API is available"""
        return bool(self.api_key and self.api_key.startswith('hf_'))
    
    async def check_models(self) -> List[str]:
        """Check which models are available"""
        if not self.is_available():
            print("❌ No API key - cannot check models")
            return []
        
        print("✅ Using clean HuggingFace chat_completion API")
        return self.models[:3]  # Return first 3 for compatibility
    
    async def list_models(self) -> List[str]:
        """List all configured models"""
        return self.models
    
    def find_relevant_chunks(self, question: str, chunks: List[str], top_k: int = 3) -> List[str]:
        """Find most relevant chunks for the question"""
        if not chunks:
            return []
        
        question_words = set(question.lower().split())
        scored_chunks = []
        
        for chunk in chunks:
            chunk_words = set(chunk.lower().split())
            # Simple word overlap scoring
            overlap = len(question_words.intersection(chunk_words))
            scored_chunks.append((chunk, overlap))
        
        # Sort by overlap score and return top_k
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return [chunk for chunk, _ in scored_chunks[:top_k]]
    
    async def generate_response(self, question: str, document_text: str, chunks: List[str] = None) -> Dict:
        """Generate response using HuggingFace chat_completion API"""
        start_time = time.time()
        
        if not self.is_available():
            return {
                "answer": "🔑 **HuggingFace API Key Required**\n\nPlease set HUGGINGFACE_API_KEY in your environment.\n\n**Steps:**\n1. Go to https://huggingface.co/settings/tokens\n2. Create a new token\n3. Add it to your .env file: `HUGGINGFACE_API_KEY=hf_your_token`\n4. Restart the Python server",
                "model": "none",
                "processing_time": time.time() - start_time
            }
        
        # Find relevant context
        if chunks:
            relevant_chunks = self.find_relevant_chunks(question, chunks, 3)
            context = "\n\n".join(relevant_chunks)
        else:
            context = document_text[:1500]  # Use first 1500 chars if no chunks
        
        # Truncate context if too long
        if len(context) > 2000:
            context = context[:2000] + "..."
        
        print(f"📝 Context length: {len(context)} characters")
        
        # Use the working HuggingFace API
        try:
            from huggingface_hub import InferenceClient
            
            # Initialize client
            client = InferenceClient(api_key=self.api_key)
            
            # Try each model until one works
            for model_name in self.models:
                try:
                    print(f"🎯 Trying model: {model_name}")
                    
                    # Create messages for chat completion
                    messages = [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that answers questions based on provided documents. Be concise and accurate. Format your response using markdown when appropriate (use **bold**, ### headings, - bullet points, etc.)."
                        },
                        {
                            "role": "user", 
                            "content": f"Document: {context}\n\nQuestion: {question}\n\nPlease answer the question based on the document above. Use markdown formatting to make your response clear and well-structured."
                        }
                    ]
                    
                    # Use chat completion
                    response = client.chat_completion(
                        model=model_name,
                        messages=messages,
                        max_tokens=400,
                        temperature=0.7
                    )
                    
                    # Extract answer from response
                    if response and response.choices:
                        answer = response.choices[0].message.content.strip()
                        
                        if answer and len(answer) > 10:
                            processing_time = time.time() - start_time
                            print(f"✅ Success with {model_name} in {processing_time:.2f}s")
                            
                            # Return clean answer without prefix
                            return {
                                "answer": answer,  # 🔥 CLEAN - No prefix!
                                "model": model_name,
                                "processing_time": processing_time
                            }
                
                except Exception as e:
                    print(f"❌ Model {model_name} failed: {str(e)}")
                    
                    # Check for specific errors
                    if "404" in str(e):
                        print(f"➡️ Model {model_name} not available, trying next...")
                        continue
                    elif "401" in str(e) or "unauthorized" in str(e).lower():
                        print(f"🔑 Unauthorized for {model_name} - check API key permissions")
                        continue
                    elif "429" in str(e) or "rate" in str(e).lower():
                        print(f"⚠️ Rate limited for {model_name}, trying next...")
                        continue
                    else:
                        print(f"❌ Unexpected error with {model_name}: {str(e)}")
                        continue
            
        except ImportError:
            return {
                "answer": "🔧 **Missing Dependency**\n\nPlease install the updated huggingface_hub:\n\n```bash\npip install huggingface_hub>=0.28.0\n```\n\nThen restart the Python server.",
                "model": "error",
                "processing_time": time.time() - start_time
            }
        except Exception as e:
            print(f"❌ Inference Client error: {str(e)}")
        
        # If all models failed, return a fallback response
        processing_time = time.time() - start_time
        return {
            "answer": f"""❌ **All AI Models Failed**

I tried {len(self.models)} different AI models but none are currently available.

**Your Question:** {question}

**Document Preview:** {document_text[:200]}...

**Next Steps:**
1. **Check your HuggingFace token** has correct permissions
2. **Try again** in 30-60 seconds
3. **Check service status** at https://status.huggingface.co

**Tried Models:** {', '.join(self.models[:5])}...""",
            "model": "fallback",
            "processing_time": processing_time
        }