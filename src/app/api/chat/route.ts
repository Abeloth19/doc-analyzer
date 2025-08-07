import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, documentText, chunks } = await request.json();

    if (!question || !documentText) {
      return NextResponse.json(
        { error: "Missing question or document" },
        { status: 400 }
      );
    }

   
    const relevantChunks = findRelevantChunks(question, chunks || [], 3);
    const context = relevantChunks.join("\n\n");

    const prompt = `Based on the following document content, answer the user's question. If the answer is not in the document, say so clearly.

Document Content:
${context}

Question: ${question}

Answer:`;

    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that answers questions based on provided documents. Be accurate and cite specific parts of the document when possible.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return NextResponse.json({
        answer:
          completion.choices[0]?.message?.content || "No response generated",
        relevantChunks: relevantChunks.length,
      });
    } else {
     
      return await handleHuggingFace(prompt);
    }
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Error processing question" },
      { status: 500 }
    );
  }
}

function findRelevantChunks(
  question: string,
  chunks: string[],
  topK: number
): string[] {
  const questionWords = question.toLowerCase().split(/\W+/);

  const scored = chunks.map((chunk) => {
    const chunkWords = chunk.toLowerCase().split(/\W+/);
    const overlap = questionWords.filter(
      (word) =>
        word.length > 3 && chunkWords.some((cword) => cword.includes(word))
    ).length;

    return { chunk, score: overlap };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}

async function handleHuggingFace(prompt: string) {
 
  if (!process.env.HUGGINGFACE_API_KEY) {
    return NextResponse.json({
      answer:
        "Please configure OpenAI API key or HuggingFace API key for full functionality.",
      relevantChunks: 0,
    });
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.3,
          do_sample: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, 
      }
    );

    const generatedText =
      response.data[0]?.generated_text || "No response generated";

    return NextResponse.json({
      answer: generatedText,
      relevantChunks: 1,
    });
  } catch (error) {
    console.error("HuggingFace API error:", error);
    return NextResponse.json({
      answer:
        "Sorry, there was an error with the AI service. Please try again or configure OpenAI API key.",
      relevantChunks: 0,
    });
  }
}
