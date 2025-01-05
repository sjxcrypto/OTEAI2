import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post('/api/auth/login', { email, password });
    this.setToken(response.data.token);
    return response.data;
  }

  static async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
  }
} 