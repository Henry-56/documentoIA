import Dexie, { Table } from 'dexie';
import { User, DocumentFile, DocumentChunk, ChatSession, ChatMessage, Role } from '../types';

class EnterpriseDB extends Dexie {
  users!: Table<User>;
  files!: Table<DocumentFile>;
  chunks!: Table<DocumentChunk>;
  sessions!: Table<ChatSession>;
  messages!: Table<ChatMessage>;

  constructor() {
    super('EnterpriseRAG_DB');
    (this as any).version(1).stores({
      users: '++id, email',
      files: '++id, uploadDate',
      chunks: '++id, documentId', // In a real Vector DB, we'd index the embedding
      sessions: '++id, userId, updatedAt',
      messages: '++id, sessionId'
    });
  }
}

export const db = new EnterpriseDB();

// Seed Admin User if not exists
export const seedAdmin = async () => {
  const adminExists = await db.users.where('email').equals('admin@test.com').first();
  if (!adminExists) {
    await db.users.add({
      name: 'System Administrator',
      email: 'admin@test.com',
      passwordHash: 'admin', // Demo password
      role: Role.ADMIN,
      createdAt: Date.now()
    });
    console.log("Admin user seeded: admin@test.com / admin");
  }
};

// Vector Similarity Helper (Cosine Similarity)
// In Postgres + pgvector, this would be: SELECT * FROM chunks ORDER BY embedding <=> query_embedding LIMIT 5;
export const findSimilarChunks = async (queryEmbedding: number[], limit: number = 4): Promise<DocumentChunk[]> => {
  const allChunks = await db.chunks.toArray();
  
  const scoredChunks = allChunks.map(chunk => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    return { ...chunk, score: similarity };
  });

  // Sort by highest similarity
  scoredChunks.sort((a, b) => b.score - a.score);
  
  return scoredChunks.slice(0, limit);
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}