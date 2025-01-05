export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

export interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  staged: string[];
  branch: string;
} 