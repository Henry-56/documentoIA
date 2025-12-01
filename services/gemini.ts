import { GoogleGenAI } from "@google/genai";
import { DocumentChunk } from "../types";
import { db, findSimilarChunks } from "./db";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Text Extraction & Summarization (Admin Side)
// We use Gemini to read the file and give us clean text, regardless of format.
export const processFileWithGemini = async (fileBase64: string, mimeType: string): Promise<string> => {
  const model = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: "Extract all the text content from this document. Return ONLY the extracted text. If it is an image or excel, describe the data in detail structurally. Do not add markdown formatting like ```text."
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("Failed to extract text from file.");
  }
};

// 2. Generate Embeddings (Vectorization)
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const model = 'text-embedding-004';

  // Note: embedContent uses 'contents' (plural) in the new SDK.
  const result = await ai.models.embedContent({
    model,
    contents: [{ parts: [{ text }] }]
  });

  // Handling the response structure for embeddings
  // The SDK returns an array of embeddings
  if (!result.embeddings || result.embeddings.length === 0 || !result.embeddings[0].values) {
    throw new Error("Failed to generate embedding");
  }

  return result.embeddings[0].values;
};

// 3. RAG Chat Generation (Client Side)
export const chatWithKnowledgeBase = async (query: string, history: { role: string, parts: { text: string }[] }[]): Promise<{ response: string, sources: string[] }> => {

  // A. Vector Search
  const queryEmbedding = await generateEmbedding(query);
  const relevantChunks = await findSimilarChunks(queryEmbedding, 5);

  if (relevantChunks.length === 0) {
    return { response: "I couldn't find any information in the uploaded documents to answer your question.", sources: [] };
  }

  // B. Context Construction
  const contextText = relevantChunks.map(c => c.text).join("\n\n---\n\n");

  // Get source document names
  const uniqueDocIds = [...new Set(relevantChunks.map(c => c.documentId))];
  const docs = await db.files.where('id').anyOf(uniqueDocIds).toArray();
  const sourceNames = docs.map(d => d.name);

  // C. Generation
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a helpful and professional assistant. 
  Answer the user's question using ONLY the context provided below.
  If the answer is not in the context, politely say you don't have that information in the provided documents.
  Do not make up information.
  ALWAYS ANSWER IN SPANISH.
  
  CONTEXT:
  ${contextText}`;

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction
      },
      contents: [
        ...history,
        { role: 'user', parts: [{ text: query }] }
      ]
    });

    return {
      response: response.text || "I processed the context but couldn't generate a response.",
      sources: sourceNames
    };
  } catch (error) {
    console.error("Chat Generation Error:", error);
    return { response: "I encountered an error while trying to answer your question.", sources: [] };
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};