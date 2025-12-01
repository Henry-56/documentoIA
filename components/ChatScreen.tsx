import React, { useState, useRef, useEffect } from 'react';
import { UploadedFile, Message, Sender } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { Button } from './Button';
import { Send, FileText, Bot, User as UserIcon, LogOut, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatScreenProps {
  file: UploadedFile;
  onLogout: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ file, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hello! I've analyzed **${file.name}**. You can now ask me any questions about its content.`,
      sender: Sender.BOT,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.BOT,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error communicating with Gemini. Please check your connection or API key.",
        sender: Sender.BOT,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Sidebar - File Info (Desktop) */}
      <div className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 p-6 z-10 shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <span className="font-bold text-xl text-slate-800">DocuMind</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current File</h3>
          <div className="flex items-start gap-3">
            <div className="bg-red-100 text-red-600 p-2 rounded-lg">
              <FileText size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-slate-700 truncate text-sm" title={file.name}>{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(0)} KB • {file.type.split('/')[1].toUpperCase()}</p>
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={onLogout} className="mt-4 justify-center">
          <LogOut size={16} /> End Session
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
           <span className="font-bold text-slate-800 flex items-center gap-2">
             <FileText size={18} className="text-blue-600"/>
             <span className="truncate max-w-[200px]">{file.name}</span>
           </span>
           <button onClick={onLogout} className="text-slate-500 hover:text-red-500">
             <LogOut size={20} />
           </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm
                  ${msg.sender === Sender.USER ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}
                `}>
                  {msg.sender === Sender.USER ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`
                  p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                  ${msg.sender === Sender.USER 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }
                `}>
                  {msg.sender === Sender.BOT ? (
                     <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:text-slate-900 prose-a:text-blue-600">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start w-full">
               <div className="flex gap-3 max-w-[70%]">
                 <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                   <Bot size={16} />
                 </div>
                 <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4 md:p-6">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about the document..."
              className="flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none shadow-inner max-h-32 min-h-[50px]"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            AI can make mistakes. Please double-check important information.
          </p>
        </div>
      </div>
    </div>
  );
};