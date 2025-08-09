import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "text/plain") {
      return NextResponse.json(
        {
          error: "Only text files (.txt) are supported",
          fileType: file.type,
          suggestion:
            "Please convert your document to a plain text file (.txt) and try again.",
          instructions: [
            "For PDF files:",
            "1. Open your PDF in any PDF viewer",
            "2. Select all text (Ctrl+A or Cmd+A)",
            "3. Copy the text (Ctrl+C or Cmd+C)",
            "4. Open a text editor (Notepad, TextEdit, etc.)",
            "5. Paste the content (Ctrl+V or Cmd+V)",
            "6. Save as a .txt file",
            "7. Upload the .txt file here",
          ],
        },
        { status: 400 }
      );
    }


    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 5MB for text files.",
          fileSize: file.size,
          maxSize: maxSize,
        },
        { status: 413 }
      );
    }


    const buffer = await file.arrayBuffer();
    let extractedText = "";

    try {
      extractedText = new TextDecoder("utf-8").decode(buffer);
    } catch (decodingError) {
      console.error("Text decoding error:", decodingError);
      return NextResponse.json(
        {
          error:
            "Failed to decode text file. Please ensure it's saved with UTF-8 encoding.",
        },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Text file appears to be empty.",
          debug: { fileSize: file.size, extractedLength: extractedText.length },
        },
        { status: 422 }
      );
    }

     const originalLength = extractedText.length;
    const cleanedText = extractedText
      .replace(/\r\n/g, "\n") 
      .replace(/\r/g, "\n")
      .replace(/\s+/g, " ") 
      .replace(/\n+/g, "\n") 
      .trim();

    if (cleanedText.length < 10) {
      return NextResponse.json(
        {
          error:
            "File contains too little text content to analyze (minimum 10 characters).",
          debug: {
            originalLength,
            cleanedLength: cleanedText.length,
          },
        },
        { status: 422 }
      );
    }


    const chunks = createTextChunks(cleanedText, 500);

    return NextResponse.json({
      success: true,
      text: cleanedText,
      chunks: chunks,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      textLength: cleanedText.length,
      chunkCount: chunks.length,
      processingMethod: "text-decoder",
      message: "Text file processed successfully! Ready for AI analysis. 🎉",
    });
  } catch (error) {
    console.error("💥 Upload processing error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing the file.",
        debug: {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : "UnknownError",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

function createTextChunks(text: string, maxChunkSize: number): string[] {
  if (!text || text.length === 0) return [];


  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];


  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    if (
      currentChunk.length + trimmedParagraph.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedParagraph;
    } else {
      currentChunk +=
        (currentChunk.length > 0 ? "\n\n" : "") + trimmedParagraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 1 && chunks[0].length > maxChunkSize) {
    return splitBySentences(text, maxChunkSize);
  }


  return chunks.filter((chunk) => chunk.length >= 20);
}

function splitBySentences(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let currentChunk = "";

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) continue;

    const potentialChunk =
      currentChunk + (currentChunk ? ". " : "") + cleanSentence + ".";

    if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk + ".");
      currentChunk = cleanSentence;
    } else {
      currentChunk = potentialChunk.slice(0, -1); 
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk + ".");
  }

  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChunkSize) {
      finalChunks.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += maxChunkSize) {
        finalChunks.push(chunk.slice(i, i + maxChunkSize));
      }
    }
  }

  return finalChunks.filter((chunk) => chunk.length >= 20);
}
