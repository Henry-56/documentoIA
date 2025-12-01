import React, { useCallback, useState } from 'react';
import { UploadedFile } from '../types';
import { Button } from './Button';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { fileToBase64 } from '../services/geminiService';

interface UploadScreenProps {
  onFileSelect: (file: UploadedFile) => void;
  user: { name: string };
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onFileSelect, user }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File is too large. Max size is 10MB.");
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, PNG, JPG, or Text files.");
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      onFileSelect({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
    } catch (e) {
      setError("Failed to read file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl text-blue-600 tracking-tight">DocuMind AI</div>
        <div className="text-sm text-slate-500">Welcome, {user.name}</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Upload your Document</h2>
          <p className="text-slate-500">
            Upload a PDF, Image, or Text file. Gemini 1.5 Flash will analyze it and allow you to chat with the content instantly.
          </p>
        </div>

        <div 
          className={`
            w-full max-w-xl border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
            <UploadCloud size={40} />
          </div>
          <p className="text-xl font-medium text-slate-900 mb-2">Click to upload or drag and drop</p>
          <p className="text-slate-500 text-sm mb-6">PDF, PNG, JPG, TXT up to 10MB</p>
          
          <div className="flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1"><FileText size={14}/> PDF / Text</div>
            <div className="flex items-center gap-1"><ImageIcon size={14}/> Images</div>
          </div>

          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {isProcessing && (
           <div className="mt-8 flex items-center gap-3 text-blue-600 font-medium animate-pulse">
             <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
             <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-75"></div>
             <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
             Processing document...
           </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </main>
    </div>
  );
};