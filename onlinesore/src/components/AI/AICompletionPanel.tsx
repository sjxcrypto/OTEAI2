import React from 'react';
import styled from '@emotion/styled';

/**
 * Main container for AI completion suggestions.
 * Fixed width panel with scrollable content.
 */
const Panel = styled.div`
  width: 300px;
  background: #252525;
  border-left: 1px solid #404040;
  color: #ffffff;
  padding: 16px;
  overflow-y: auto;
`;

/**
 * Interactive item displaying a single completion suggestion.
 * Supports keyboard navigation and focus states.
 */
const CompletionItem = styled.div`
  padding: 8px;
  background: #333333;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  
  &:hover, &:focus {
    background: #404040;
    outline: 2px solid #007acc;
    outline-offset: -2px;
  }
`;

/**
 * Loading state indicator for when AI is generating suggestions.
 */
const LoadingIndicator = styled.div`
  padding: 16px;
  text-align: center;
  color: #888;
`;

interface AICompletionPanelProps {
  isGenerating: boolean;
  completion: {
    completion: string;
    alternatives?: string[];
  } | null;
  onAccept: (completionText: string) => void;
}

/**
 * AICompletionPanel displays AI-generated code suggestions and allows users to
 * accept and insert them into the editor.
 * 
 * Features:
 * - Displays main completion suggestion
 * - Shows alternative suggestions
 * - Loading state indication
 * - Keyboard navigation support
 * - Screen reader compatibility
 * 
 * @component
 * @param {object} props
 * @param {boolean} props.isGenerating - Whether AI is currently generating suggestions
 * @param {object|null} props.completion - The completion data from the AI
 * @param {string} props.completion.completion - Main completion suggestion
 * @param {string[]} [props.completion.alternatives] - Alternative suggestions
 * @param {(text: string) => void} props.onAccept - Callback when a suggestion is accepted
 */
export const AICompletionPanel: React.FC<AICompletionPanelProps> = ({
  isGenerating,
  completion,
  onAccept,
}) => {
  const handleKeyDown = (text: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAccept(text);
    }
  };

  return (
    <Panel role="complementary" aria-label="AI Suggestions">
      <h3>AI Suggestions</h3>
      {isGenerating ? (
        <LoadingIndicator>Generating suggestions...</LoadingIndicator>
      ) : completion ? (
        <>
          <CompletionItem 
            onClick={() => onAccept(completion.completion)}
            onKeyDown={handleKeyDown(completion.completion)}
            role="button"
            tabIndex={0}
            aria-label="Accept main suggestion"
          >
            {completion.completion}
          </CompletionItem>
          {completion.alternatives?.map((alt: string, index: number) => (
            <CompletionItem 
              key={index} 
              onClick={() => onAccept(alt)}
              onKeyDown={handleKeyDown(alt)}
              role="button"
              tabIndex={0}
              aria-label={`Accept alternative suggestion ${index + 1}`}
            >
              {alt}
            </CompletionItem>
          ))}
        </>
      ) : (
        <div role="status">Press Ctrl+Space to generate suggestions</div>
      )}
    </Panel>
  );
}; 