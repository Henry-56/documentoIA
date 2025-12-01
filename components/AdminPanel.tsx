import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { processFileWithGemini, generateEmbedding, fileToBase64 } from '../services/gemini';
import { extractTextFromExcel } from '../services/excel';
import { DocumentFile } from '../types';
import { UploadCloud, CheckCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const files = useLiveQuery(() => db.files.orderBy('uploadDate').reverse().toArray());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploading(true);
    setUploadStatus('Leyendo archivo...');

    try {
      // 1. Get Base64 (for storage/Gemini)
      const base64 = await fileToBase64(file);

      // 2. Save metadata
      const fileId = await db.files.add({
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: Date.now(),
        processed: false
      }) as number;

      let extractedText = "";

      // 3. Extract text
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
        setUploadStatus('Procesando Excel localmente...');
        extractedText = await extractTextFromExcel(file);
      } else {
        setUploadStatus('Extrayendo contenido con Gemini...');
        // Extract text using Gemini (Multimodal) for non-Excel files
        extractedText = await processFileWithGemini(base64, file.type);
      }

      await db.files.update(fileId, { content: extractedText });

      setUploadStatus('Vectorizando contenido...');

      // 4. Chunking (Split by words to preserve meaning)
      const targetChunkSize = 1000;
      const chunks: string[] = [];

      if (extractedText) {
        const words = extractedText.split(/\s+/);
        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const word of words) {
          if (currentLength + word.length + 1 > targetChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            currentLength = 0;
          }
          currentChunk.push(word);
          currentLength += word.length + 1; // +1 for space
        }
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
        }
      }

      if (chunks.length === 0 && extractedText) {
        // Fallback if split failed or text was single huge word
        chunks.push(extractedText.substring(0, 5000));
      }

      // 5. Generate Embeddings for each chunk
      let completedChunks = 0;
      for (const chunkText of chunks) {
        if (!chunkText.trim()) continue;

        // Rate limit prevention (simulated delay)
        // In production, you'd have a queue system
        setUploadStatus(`Vectorizando fragmento ${completedChunks + 1}/${chunks.length}...`);

        const vector = await generateEmbedding(chunkText);
        await db.chunks.add({
          documentId: fileId,
          text: chunkText,
          embedding: vector
        });
        completedChunks++;
      }

      await db.files.update(fileId, { processed: true });
      setUploadStatus('¡Éxito!');
      setTimeout(() => setUploadStatus(''), 2000);

    } catch (err) {
      console.error(err);
      setUploadStatus('Error procesando archivo.');
      // Optional: Delete the file entry if processing failed
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const deleteFile = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este archivo y su índice?")) {
      await db.files.delete(id);
      await db.chunks.where('documentId').equals(id).delete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Consola de Administración</h1>
        <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Cerrar Sesión</button>
      </div>

      {/* Upload Zone */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Ingestar Conocimiento</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-gray-50">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
              <p className="text-blue-600 font-medium">{uploadStatus}</p>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud size={24} />
              </div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Haz clic para subir documento
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PDF, DOCX, TXT, Excel o Imágenes hasta 10MB
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.csv,.jpg,.png,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Índice de Base de Conocimientos</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {files?.map(file => (
            <li key={file.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {file.processed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle size={12} className="mr-1" /> Vectorizado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Procesando
                  </span>
                )}
                <button onClick={() => file.id && deleteFile(file.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
          {files?.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-500 text-sm">
              No hay documentos subidos aún.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};