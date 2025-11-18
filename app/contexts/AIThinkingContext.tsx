import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIThinkingContextType {
  isAIThinking: boolean;
  setIsAIThinking: (value: boolean) => void;
}

const AIThinkingContext = createContext<AIThinkingContextType | undefined>(undefined);

export const AIThinkingProvider = ({ children }: { children: ReactNode }) => {
  const [isAIThinking, setIsAIThinking] = useState(false);

  return (
    <AIThinkingContext.Provider value={{ isAIThinking, setIsAIThinking }}>
      {children}
    </AIThinkingContext.Provider>
  );
};

export const useAIThinking = () => {
  const context = useContext(AIThinkingContext);
  if (!context) {
    throw new Error('useAIThinking must be used within AIThinkingProvider');
  }
  return context;
};
