import axios from 'axios';
import api from './api';
import { API_BASE_URL } from '@/config/apiBaseUrl';
import { clearClientSession, onSessionEstablished } from './sessionManager';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  roles: string[];
}

class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    const authData = response.data.data;
    
    // Store tokens and user data
    this.storeAuthData(authData);
    
    return authData;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const authData = response.data.data;
    
    // Store tokens and user data
    this.storeAuthData(authData);
    
    return authData;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/refresh', null, {
      params: { refreshToken },
    });
    const authData = response.data.data;
    
    this.storeAuthData(authData);
    
    return authData;
  }

  logout(): void {
    const t = localStorage.getItem('accessToken');
    if (t) {
      void axios
        .post(`${API_BASE_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${t}` } })
        .catch(() => {});
    }
    clearClientSession();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getUser(): AuthResponse | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const u = JSON.parse(userStr) as Partial<AuthResponse> & { id?: number };
      if (u == null || typeof u !== 'object') return null;
      const userId = u.userId ?? u.id;
      if (userId == null || Number.isNaN(Number(userId))) return null;
      return {
        accessToken: u.accessToken ?? '',
        refreshToken: u.refreshToken ?? '',
        tokenType: u.tokenType ?? 'Bearer',
        userId: Number(userId),
        name: u.name ?? '',
        email: u.email ?? '',
        roles: Array.isArray(u.roles) ? u.roles : [],
      };
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.roles?.includes('ROLE_ADMIN') || false;
  }

  private storeAuthData(authData: AuthResponse): void {
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.setItem('user', JSON.stringify(authData));
    onSessionEstablished();
  }
}

export default new AuthService();

