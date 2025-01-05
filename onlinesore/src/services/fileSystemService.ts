import axios from 'axios';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

export class FileSystemService {
  static async listFiles(path: string): Promise<FileNode[]> {
    const response = await axios.get(`/api/fs/list?path=${encodeURIComponent(path)}`);
    return response.data;
  }

  static async readFile(path: string): Promise<string> {
    const response = await axios.get(`/api/fs/read?path=${encodeURIComponent(path)}`);
    return response.data.content;
  }

  static async writeFile(path: string, content: string): Promise<void> {
    await axios.post('/api/fs/write', { path, content });
  }

  static async createDirectory(path: string): Promise<void> {
    await axios.post('/api/fs/mkdir', { path });
  }
} 