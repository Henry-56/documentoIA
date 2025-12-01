import { GoogleGenAI, Chat } from "@google/genai";
import { UploadedFile, Message, Sender } from "../types";

// Initialize the API client
// Note: In a real production app, you might proxy this through a backend to hide the key,
// or use Firebase App Check. For this demo, we use the env variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

/**
 * Initializes the chat session with the uploaded file context.
 * We use the "Long Context" capability of Gemini 2.5 Flash by sending the file
 * as the initial history.
 */
export const initializeChatWithFile = async (file: UploadedFile): Promise<void> => {
  const modelId = 'gemini-2.5-flash';
  
  // Clean base64 string (remove data URL prefix if present)
  const base64Data = file.data.includes('base64,') 
    ? file.data.split('base64,')[1] 
    : file.data;

  // Define the file part
  const filePart = {
    inlineData: {
      mimeType: file.type,
      data: base64Data
    }
  };

  // Create the chat session
  // We prime the history with the file and a system instruction
  chatSession = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: "You are DocuMind, an intelligent document assistant. The user has uploaded a file. Your task is to answer questions strictly based on the content of this file. If the answer is not in the file, politely state that you cannot find the information. Be concise, professional, and helpful.",
    },
    history: [
      {
        role: "user",
        parts: [
          filePart,
          { text: "Here is the file I want to discuss. Please analyze it and confirm you are ready." }
        ],
      },
      {
        role: "model",
        parts: [
          { text: "I have analyzed the file and I am ready to answer your questions about it." }
        ],
      },
    ],
  });
};

export const sendMessageToGemini = async (text: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const result = await chatSession.sendMessage({
      message: text
    });
    
    return result.text || "I processed that, but I didn't have a text response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Helper to convert file to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};