import axios from 'axios';

interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  staged: string[];
  branch: string;
}

interface GitDiff {
  path: string;
  hunks: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }[];
}

export class GitService {
  static async getStatus(): Promise<GitStatus> {
    const response = await axios.get('/api/git/status');
    return response.data;
  }

  static async commit(message: string): Promise<void> {
    await axios.post('/api/git/commit', { message });
  }

  static async checkout(branch: string): Promise<void> {
    await axios.post('/api/git/checkout', { branch });
  }

  static async pull(): Promise<void> {
    await axios.post('/api/git/pull');
  }

  static async push(): Promise<void> {
    await axios.post('/api/git/push');
  }

  static async getBranches(): Promise<string[]> {
    const response = await axios.get('/api/git/branches');
    return response.data.branches;
  }

  static async getDiff(path: string): Promise<GitDiff[]> {
    const response = await axios.get(`/api/git/diff?path=${encodeURIComponent(path)}`);
    return response.data.diffs;
  }
} 