import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Editor } from '../Editor';
import { GitService } from '../../../services/gitService';
import { FileSystemService } from '../../../services/fileSystemService';

// Mock services
jest.mock('../../../services/gitService');
jest.mock('../../../services/fileSystemService');
jest.mock('@monaco-editor/react', () => ({
  Editor: () => <div data-testid="monaco-editor">Monaco Editor</div>
}));

describe('Editor Component', () => {
  beforeEach(() => {
    // Setup mock responses
    (GitService.getStatus as jest.Mock).mockResolvedValue({
      modified: [],
      added: [],
      deleted: [],
      staged: [],
      branch: 'main'
    });
    
    (GitService.getBranches as jest.Mock).mockResolvedValue(['main', 'develop']);
    
    (FileSystemService.listFiles as jest.Mock).mockResolvedValue([
      { id: '1', name: 'test.ts', type: 'file', path: '/test.ts' }
    ]);
  });

  it('renders without crashing', () => {
    render(<Editor />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('loads git status on mount', async () => {
    render(<Editor />);
    await waitFor(() => {
      expect(GitService.getStatus).toHaveBeenCalled();
    });
  });

  it('handles git operations', async () => {
    render(<Editor />);
    
    // Test commit
    const commitButton = screen.getByLabelText('Commit changes');
    fireEvent.click(commitButton);
    
    await waitFor(() => {
      expect(GitService.commit).toHaveBeenCalled();
    });
  });

  it('handles file selection', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(FileSystemService.listFiles).toHaveBeenCalled();
    });

    const fileItem = await screen.findByText('test.ts');
    fireEvent.click(fileItem);
    
    expect(FileSystemService.readFile).toHaveBeenCalledWith('/test.ts');
  });

  it('shows loading states correctly', async () => {
    render(<Editor />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock error response
    (GitService.getStatus as jest.Mock).mockRejectedValue(new Error('Git error'));
    
    render(<Editor />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load git status')).toBeInTheDocument();
    });
  });
}); 