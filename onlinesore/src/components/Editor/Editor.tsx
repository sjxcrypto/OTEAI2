import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import styled from '@emotion/styled';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { AICompletionPanel } from '../AI/AICompletionPanel';
import { FileSystemService } from '../../services/fileSystemService';
import { GitService } from '../../services/gitService';
import { useA11y } from '../../hooks/useA11y';
import { FileNode, GitStatus, GitDiff } from '../../types';
import { FileTreeComponent } from '../FileTree/FileTree';
import { Loading } from '../Loading';
import { ErrorBoundary } from '../ErrorBoundary';
import { DiffViewer } from '../Git/DiffViewer';
import debounce from 'lodash/debounce';

/**
 * Main container for the editor application.
 * Uses a flex layout to organize the file tree, editor, and AI panel.
 */
const EditorContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #1e1e1e;
`;

/**
 * Container for the Monaco editor instance.
 * Provides proper sizing and positioning for the editor.
 */
const EditorWrapper = styled.div`
  flex: 1;
  position: relative;
`;

/**
 * Toolbar component containing Git operations and other controls.
 * Fixed height with flex layout for button arrangement.
 */
const Toolbar = styled.div`
  height: 40px;
  background: #2d2d2d;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #404040;
`;

const SidePanel = styled.div`
  width: 250px;
  background: #252525;
  border-right: 1px solid #404040;
  overflow-y: auto;
`;

const FileTree = styled.div`
  padding: 8px;
`;

const AccessibleFileTree = styled(FileTree)`
  &:focus {
    outline: 2px solid #007acc;
    outline-offset: -2px;
  }
`;

const AccessibleToolbarButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  padding: 8px;
  cursor: pointer;
  
  &:focus {
    outline: 2px solid #007acc;
    outline-offset: -2px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const GitStatusBar = styled.div`
  height: 24px;
  background: #1e1e1e;
  border-top: 1px solid #404040;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 12px;
  color: #ccc;
`;

const GitBranch = styled.span`
  margin-right: 16px;
`;

const GitStatus = styled.span`
  margin-right: 8px;
  &.modified { color: #e2c08d; }
  &.added { color: #73c991; }
  &.deleted { color: #f14c4c; }
`;

const GitDropdown = styled.select`
  background: #333333;
  color: #ffffff;
  border: 1px solid #404040;
  padding: 4px 8px;
  margin-right: 8px;
  font-size: 12px;
  cursor: pointer;

  &:focus {
    outline: 2px solid #007acc;
    outline-offset: -2px;
  }
`;

interface EditorProps {
  initialValue?: string;
  language?: string;
  theme?: 'vs-dark' | 'light';
}

/**
 * Editor is the main component of the application, providing a code editor with
 * integrated AI assistance, Git integration, and file management capabilities.
 * 
 * Features:
 * - Monaco-based code editing
 * - AI code completion (Ctrl+Space)
 * - Git integration (branch switching, commit, pull, push)
 * - File tree navigation
 * - Diff viewing
 * - Accessibility support
 * 
 * Keyboard Shortcuts:
 * - Ctrl+Space: Trigger AI completion
 * - Ctrl+S: Save current file
 * - Ctrl+G: Quick commit
 * - F1: Help menu
 * 
 * @component
 * @param {object} props
 * @param {string} [props.initialValue=''] - Initial content of the editor
 * @param {string} [props.language='typescript'] - Programming language for syntax highlighting
 * @param {('vs-dark'|'light')} [props.theme='vs-dark'] - Editor color theme
 */
export const Editor: React.FC<EditorProps> = ({
  initialValue = '',
  language = 'typescript',
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState(initialValue);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const { 
    generateCompletion, 
    isGenerating, 
    completion 
  } = useAIAssistant();
  const { announceMessage } = useA11y();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setPushing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffs, setDiffs] = useState<GitDiff[]>([]);
  const [isLoadingGit, setIsLoadingGit] = useState(false);

  // Memoize expensive computations
  const editorOptions = useMemo(() => ({
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    rulers: [80],
    wordWrap: 'on',
    wrappingIndent: 'indent',
    automaticLayout: true,
  }), []);

  // Memoize callbacks
  /**
   * Handles file selection from the file tree.
   * Loads and displays the selected file's content in the editor.
   * 
   * @param {string} path - Path to the selected file
   */
  const handleFileSelect = useCallback(async (path: string) => {
    try {
      setIsLoading(true);
      const content = await FileSystemService.readFile(path);
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          model.setValue(content);
          announceMessage(`Opened ${path}`);
        }
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      setError('Failed to read file');
      announceMessage('Failed to read file');
    } finally {
      setIsLoading(false);
    }
  }, [announceMessage]);

  // Use intersection observer for lazy loading
  const fileTreeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadFiles();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (fileTreeRef.current) {
      observer.observe(fileTreeRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadFiles();
    loadGitStatus();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const fileList = await FileSystemService.listFiles('/');
      setFiles(fileList);
      setError(null);
    } catch (error) {
      console.error('Failed to load files:', error);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGitStatus = useCallback(async () => {
    setIsLoadingGit(true);
    try {
      let retries = 3;
      while (retries > 0) {
        try {
          const status = await GitService.getStatus();
          setGitStatus(status);
          setError(null);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
      setError('Failed to load git status');
      announceMessage('Failed to load git status');
    } finally {
      setIsLoadingGit(false);
    }
  }, [announceMessage]);

  /**
   * Handles Git commit operations.
   * Commits current changes with the provided message.
   * 
   * @param {string} message - The commit message
   */
  const handleCommit = useCallback(async (message: string) => {
    try {
      setIsCommitting(true);
      await GitService.commit(message);
      await loadGitStatus();
      announceMessage('Changes committed successfully');
    } catch (error) {
      console.error('Failed to commit:', error);
      setError('Failed to commit changes');
      announceMessage('Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  }, [loadGitStatus, announceMessage]);

  useEffect(() => {
    loadGitStatus();
    const interval = setInterval(loadGitStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadGitStatus]);

  const loadBranches = useCallback(async () => {
    try {
      const branchList = await GitService.getBranches();
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setError('Failed to load branches');
      announceMessage('Failed to load branches');
    }
  }, [announceMessage]);

  const handleBranchSwitch = useCallback(async (branch: string) => {
    try {
      await GitService.checkout(branch);
      await loadGitStatus();
      announceMessage(`Switched to branch ${branch}`);
    } catch (error) {
      console.error('Failed to switch branch:', error);
      setError('Failed to switch branch');
      announceMessage('Failed to switch branch');
    }
  }, [loadGitStatus, announceMessage]);

  const handlePull = useCallback(async () => {
    try {
      setIsPulling(true);
      await GitService.pull();
      await loadGitStatus();
      announceMessage('Successfully pulled changes');
    } catch (error) {
      console.error('Failed to pull:', error);
      setError('Failed to pull changes');
      announceMessage('Failed to pull changes');
    } finally {
      setIsPulling(false);
    }
  }, [loadGitStatus, announceMessage]);

  const handlePush = useCallback(async () => {
    try {
      setPushing(true);
      await GitService.push();
      await loadGitStatus();
      announceMessage('Successfully pushed changes');
    } catch (error) {
      console.error('Failed to push:', error);
      setError('Failed to push changes');
      announceMessage('Failed to push changes');
    } finally {
      setPushing(false);
    }
  }, [loadGitStatus, announceMessage]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  /**
   * Handles the mounting of the Monaco editor instance.
   * Sets up keyboard shortcuts and command bindings.
   * 
   * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance
   */
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    console.log('Editor mounted successfully');
    editorRef.current = editor;
    
    // Add AI completion command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, async () => {
      try {
        const selection = editor.getSelection();
        if (selection) {
          const selectedText = editor.getModel()?.getValueInRange(selection);
          if (selectedText) {
            announceMessage('Generating AI completion...');
            await generateCompletion(selectedText);
            announceMessage('AI suggestions ready');
          }
        }
      } catch (error) {
        console.error('AI completion error:', error);
        setError('Failed to generate AI completion');
        announceMessage('Failed to generate AI completion');
      }
    });

    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, async () => {
      try {
        if (editorRef.current) {
          const content = editorRef.current.getValue();
          await FileSystemService.writeFile('/current-file.ts', content);
          announceMessage('File saved successfully');
        }
      } catch (error) {
        console.error('Save error:', error);
        setError('Failed to save file');
        announceMessage('Failed to save file');
      }
    });

    // Add Git commit command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_G, () => {
      const message = prompt('Enter commit message:');
      if (message) {
        handleCommit(message);
      }
    });
  };

  // Add keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault();
      announceMessage('Help menu opened');
      // Open help menu
    }
  };

  // Add keyboard navigation for file tree
  const handleFileTreeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      const path = target.getAttribute('data-path');
      if (path) {
        handleFileSelect(path);
      }
    }
  };

  /**
   * Handles the display of Git diffs.
   * Loads and shows differences between current state and last commit.
   */
  const handleViewDiff = useCallback(async () => {
    try {
      setIsLoading(true);
      const diffData = await GitService.getDiff('.');
      setDiffs(diffData);
      setShowDiff(true);
      announceMessage('Showing git differences');
    } catch (error) {
      console.error('Failed to load diff:', error);
      setError('Failed to load diff');
      announceMessage('Failed to load diff');
    } finally {
      setIsLoading(false);
    }
  }, [announceMessage]);

  const debouncedGeneration = useCallback(
    debounce(async (text: string) => {
      await generateCompletion(text);
    }, 300),
    [generateCompletion]
  );

  return (
    <ErrorBoundary>
      <EditorContainer onKeyDown={handleKeyDown}>
        <SidePanel>
          <AccessibleFileTree
            ref={fileTreeRef}
            role="tree"
            aria-label="File explorer"
            tabIndex={0}
            onKeyDown={handleFileTreeKeyDown}
          >
            {isLoading ? (
              <Loading />
            ) : error ? (
              <div role="alert" style={{ color: 'red', padding: '8px' }}>
                {error}
              </div>
            ) : (
              <FileTreeComponent files={files} onSelect={handleFileSelect} />
            )}
          </AccessibleFileTree>
        </SidePanel>
        <EditorWrapper>
          <Toolbar>
            <GitDropdown
              value={gitStatus?.branch || ''}
              onChange={(e) => handleBranchSwitch(e.target.value)}
              aria-label="Select branch"
            >
              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </GitDropdown>
            <AccessibleToolbarButton
              onClick={() => loadGitStatus()}
              aria-label="Refresh git status"
            >
              ↻
            </AccessibleToolbarButton>
            <AccessibleToolbarButton
              onClick={handlePull}
              aria-label="Pull changes"
              disabled={isPulling}
            >
              Pull
            </AccessibleToolbarButton>
            <AccessibleToolbarButton
              onClick={handlePush}
              aria-label="Push changes"
              disabled={isPushing}
            >
              Push
            </AccessibleToolbarButton>
            <AccessibleToolbarButton
              onClick={() => {
                const message = prompt('Enter commit message:');
                if (message) handleCommit(message);
              }}
              aria-label="Commit changes"
              disabled={isCommitting}
            >
              Commit
            </AccessibleToolbarButton>
            <AccessibleToolbarButton
              onClick={handleViewDiff}
              aria-label="View changes"
            >
              View Changes
            </AccessibleToolbarButton>
          </Toolbar>
          <MonacoEditor
            height="calc(100% - 40px)"
            defaultLanguage={language}
            defaultValue={code}
            theme={theme}
            onMount={handleEditorDidMount}
            options={{
              ...editorOptions,
            }}
            loading={<Loading />}
          />
          <GitStatusBar>
            {gitStatus && (
              <>
                <GitBranch>
                  Branch: {gitStatus.branch}
                </GitBranch>
                {gitStatus.modified.length > 0 && (
                  <GitStatus className="modified">
                    {gitStatus.modified.length} modified
                  </GitStatus>
                )}
                {gitStatus.added.length > 0 && (
                  <GitStatus className="added">
                    {gitStatus.added.length} added
                  </GitStatus>
                )}
                {gitStatus.deleted.length > 0 && (
                  <GitStatus className="deleted">
                    {gitStatus.deleted.length} deleted
                  </GitStatus>
                )}
              </>
            )}
          </GitStatusBar>
          {showDiff && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '50%',
                height: 'calc(100% - 64px)',
                background: '#1e1e1e',
                borderLeft: '1px solid #404040',
                overflow: 'auto',
              }}
            >
              <AccessibleToolbarButton
                onClick={() => setShowDiff(false)}
                aria-label="Close diff view"
                style={{ position: 'absolute', right: '8px', top: '8px' }}
              >
                ×
              </AccessibleToolbarButton>
              <DiffViewer diffs={diffs} />
            </div>
          )}
        </EditorWrapper>
        <AICompletionPanel
          isGenerating={isGenerating}
          completion={completion}
          onAccept={(completionText) => {
            if (editorRef.current) {
              const selection = editorRef.current.getSelection();
              if (selection) {
                editorRef.current.executeEdits('ai-completion', [{
                  range: selection,
                  text: completionText,
                }]);
              }
            }
          }}
        />
      </EditorContainer>
    </ErrorBoundary>
  );
}; 