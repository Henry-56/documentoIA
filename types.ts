export enum Role {
  ADMIN = 'admin',
  CLIENT = 'client'
}

export interface User {
  id?: number;
  name: string;
  email: string;
  passwordHash: string; // In demo we store simple string, prod uses bcrypt
  role: Role;
  createdAt: number;
}

export interface DocumentFile {
  id?: number;
  name: string;
  type: string;
  size: number;
  uploadDate: number;
  processed: boolean;
  content?: string; // Raw text content
}

export interface DocumentChunk {
  id?: number;
  documentId: number;
  text: string;
  embedding: number[]; // Vector representation
}

export interface ChatSession {
  id?: number;
  userId: number;
  title: string;
  updatedAt: number;
}

export interface ChatMessage {
  id?: number;
  sessionId: number;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  relevantDocs?: string[]; // IDs or Names of docs used for this answer
}

export enum AppRoute {
  ROLE_SELECTION = 'ROLE_SELECTION',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  CLIENT_DASHBOARD = 'CLIENT_DASHBOARD',
}

// Types for direct file chat (Gemini 2.5 Flash Long Context)
export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 string
}

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isError?: boolean;
}
