import axios from 'axios';
import type {
    PipelineObject,
    Inspection,
    DashboardStats,
    ImportResult,
    InspectionFilter
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Objects API
export const objectsAPI = {
    getAll: async (params?: { pipeline_id?: string; object_type?: string }) => {
        const response = await api.get<PipelineObject[]>('/api/objects/', { params });
        return response.data;
    },

    getById: async (objectId: number) => {
        const response = await api.get<PipelineObject>(`/api/objects/${objectId}`);
        return response.data;
    },

    getMapMarkers: async (filters?: InspectionFilter) => {
        const response = await api.get<PipelineObject[]>('/api/objects/map/markers', {
            params: filters
        });
        return response.data;
    },
};

// Inspections API
export const inspectionsAPI = {
    getAll: async (filters?: InspectionFilter & { skip?: number; limit?: number }) => {
        const response = await api.get<Inspection[]>('/api/inspections/', { params: filters });
        return response.data;
    },

    getById: async (diagId: number) => {
        const response = await api.get<Inspection>(`/api/inspections/${diagId}`);
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getStats: async () => {
        const response = await api.get<DashboardStats>('/api/dashboard/stats');
        return response.data;
    },
};

// Import API
export const importAPI = {
    uploadCSV: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<ImportResult>('/api/import/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Reports API
export const reportsAPI = {
    generate: async (params: {
        format: 'html' | 'pdf';
        date_from?: string;
        date_to?: string;
        pipeline_id?: string;
        risk_level?: string;
    }) => {
        const response = await api.get('/api/reports/generate', {
            params,
            responseType: params.format === 'pdf' ? 'blob' : 'text'
        });
        return response.data;
    },
};

// Auth API
export const authAPI = {
    login: async (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post<{ access_token: string; token_type: string }>(
            '/api/auth/login',
            formData,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return response.data;
    },

    register: async (userData: {
        username: string;
        email: string;
        password: string;
        full_name?: string;
    }) => {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    },

    getMe: async (token: string) => {
        const response = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getUsers: async (token: string) => {
        const response = await api.get('/api/auth/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateUserRole: async (token: string, userId: number, role: string) => {
        const response = await api.put(
            `/api/auth/users/${userId}/role`,
            { role },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    deleteUser: async (token: string, userId: number) => {
        const response = await api.delete(`/api/auth/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },
};

export default api;
