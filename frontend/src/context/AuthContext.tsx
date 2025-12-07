import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'inspector' | 'analyst' | 'guest';
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token');
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    // Add timeout to prevent infinite loading
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const userData = await authAPI.getMe(token);
                    clearTimeout(timeoutId);
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (username: string, password: string) => {
        const response = await authAPI.login(username, password);
        const newToken = response.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);

        const userData = await authAPI.getMe(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const hasRole = (roles: string[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
