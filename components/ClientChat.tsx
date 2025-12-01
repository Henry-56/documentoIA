import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { chatWithKnowledgeBase } from '../services/gemini';
import { Send, Bot, User as UserIcon, BookOpen, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ClientChat: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    setMessages([{
      sessionId: 0,
      role: 'model',
      content: `¡Hola ${user.name}! Tengo acceso a la base de conocimientos de la empresa. Pregúntame cualquier cosa sobre los documentos.`,
      timestamp: Date.now()
    }]);
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      sessionId: 0,
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history for API (last 5 turns)
      const history = messages.slice(-5).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const { response, sources } = await chatWithKnowledgeBase(userMsg.content, history);

      const botMsg: ChatMessage = {
        sessionId: 0,
        role: 'model',
        content: response,
        timestamp: Date.now(),
        relevantDocs: sources
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sessionId: 0,
        role: 'model',
        content: "Tengo problemas para conectarme a la base de conocimientos en este momento.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-gray-700">Asistente Empresarial</span>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Citations */}
                {msg.role === 'model' && msg.relevantDocs && msg.relevantDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.relevantDocs.map((doc, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 border border-gray-200 text-gray-500">
                        <BookOpen size={10} className="mr-1" /> {doc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400 text-sm ml-12">
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Haz una pregunta sobre los documentos subidos..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};