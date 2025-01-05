import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AICompletionPanel } from '../AICompletionPanel';

describe('AICompletionPanel Component', () => {
  const mockOnAccept = jest.fn();
  
  beforeEach(() => {
    mockOnAccept.mockClear();
  });

  it('shows loading state', () => {
    render(
      <AICompletionPanel
        isGenerating={true}
        completion={null}
        onAccept={mockOnAccept}
      />
    );
    
    expect(screen.getByText('Generating suggestions...')).toBeInTheDocument();
  });

  it('displays completion suggestions', () => {
    const completion = {
      completion: 'test completion',
      alternatives: ['alt1', 'alt2']
    };

    render(
      <AICompletionPanel
        isGenerating={false}
        completion={completion}
        onAccept={mockOnAccept}
      />
    );
    
    expect(screen.getByText('test completion')).toBeInTheDocument();
    expect(screen.getByText('alt1')).toBeInTheDocument();
    expect(screen.getByText('alt2')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    const completion = {
      completion: 'test completion'
    };

    render(
      <AICompletionPanel
        isGenerating={false}
        completion={completion}
        onAccept={mockOnAccept}
      />
    );
    
    const suggestion = screen.getByText('test completion');
    fireEvent.keyDown(suggestion, { key: 'Enter' });
    
    expect(mockOnAccept).toHaveBeenCalledWith('test completion');
  });
}); 