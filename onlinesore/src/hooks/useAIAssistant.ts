import { useState, useCallback } from 'react';
import axios from 'axios';

interface AIAssistantResponse {
  completion: string;
  alternatives?: string[];
}

export const useAIAssistant = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [completion, setCompletion] = useState<AIAssistantResponse | null>(null);

  const generateCompletion = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/ai/completion', { prompt });
      setCompletion(response.data);
    } catch (error) {
      console.error('AI completion error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateCompletion,
    isGenerating,
    completion,
  };
}; 