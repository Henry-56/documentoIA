import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
                <span className="font-bold text-gray-900 text-lg">BaseDeConocimiento</span>
              </div>
              {title && (
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  <span className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500">
                    / {title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};