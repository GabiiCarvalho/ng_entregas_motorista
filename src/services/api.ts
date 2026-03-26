// src/services/api.ts — Cliente HTTP do app do motorista
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// iOS Simulator  → localhost:3000
// Android Emu    → 10.0.2.2:3000
// Dispositivo    → IP_DA_MAQUINA:3000
const BASE_URL  = 'http://localhost:3000/api';
const TOKEN_KEY = 'ng_motorista_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (cfg) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const saveToken  = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const getToken   = ()          => SecureStore.getItemAsync(TOKEN_KEY);
export const removeToken= ()          => SecureStore.deleteItemAsync(TOKEN_KEY);
export const isLoggedIn = async ()    => !!(await getToken());

// ── Types ─────────────────────────────────────
export interface Motorista {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento?: string;
  foto_url?: string;
  face_ok: boolean;
  avaliacao: number;
  total_corridas: number;
  cnh_status: 'pendente'|'aprovado'|'reprovado';
  crlv_status: 'pendente'|'aprovado'|'reprovado';
  online: boolean;
  lat?: number;
  lng?: number;
}

export interface Corrida {
  id: number;
  cliente_nome: string;
  cliente_avaliacao: number;
  coleta: string;
  entrega: string;
  distancia_km: number;
  duracao_min: number;
  valor: number;
  metodo_pagamento: string;
  status: string;
  criado_em: string;
}

export interface GanhoDiario {
  data: string;
  bruto: number;
  taxa_app: number;
  liquido: number;
  num_corridas: number;
  taxa_paga: boolean;
}

// ── Auth ──────────────────────────────────────
export const authApi = {
  cadastrar: async (data: {
    nome: string; telefone: string; email: string;
    senha: string; cpf: string; data_nascimento: string;
  }) => {
    const r = await api.post('/auth/motorista/cadastro', data);
    if (r.data.ok && r.data.token) await saveToken(r.data.token);
    return r.data;
  },

  login: async (telefone: string, senha: string) => {
    const r = await api.post('/auth/motorista/login', { telefone, senha });
    if (r.data.ok && r.data.token) await saveToken(r.data.token);
    return r.data;
  },

  perfil: async (): Promise<{ ok: boolean; motorista: Motorista }> => {
    const r = await api.get('/auth/motorista/perfil');
    return r.data;
  },

  face: async (formData: FormData) => {
    const r = await api.post('/auth/motorista/face', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data;
  },

  uploadDoc: async (formData: FormData) => {
    const r = await api.post('/auth/motorista/upload-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data;
  },

  uploadFoto: async (formData: FormData) => {
    const r = await api.post('/auth/motorista/upload-foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data;
  },

  atualizarLocalizacao: async (lat: number, lng: number, online: boolean) => {
    const r = await api.patch('/auth/motorista/localizacao',
      { lat, lng, online });
    return r.data;
  },

  logout: async () => removeToken(),
};

// ── Corridas ──────────────────────────────────
export const corridasApi = {
  listar: async (status?: string): Promise<Corrida[]> => {
    const r = await api.get('/corridas', { params: status ? { status } : {} });
    return r.data.ok ? r.data.corridas : [];
  },

  registrar: async (data: {
    cliente_nome: string; coleta: string; entrega: string;
    distancia_km: number; duracao_min: number;
    valor: number; metodo_pagamento: string; status?: string;
  }) => {
    const r = await api.post('/corridas', data);
    return r.data;
  },
};

// ── Ganhos ────────────────────────────────────
export const ganhosApi = {
  hoje: async (): Promise<GanhoDiario> => {
    const r = await api.get('/ganhos/hoje');
    return r.data.ok ? r.data.ganho : {
      bruto: 0, taxa_app: 0, liquido: 0, num_corridas: 0, taxa_paga: false
    };
  },

  semana: async (): Promise<GanhoDiario[]> => {
    const r = await api.get('/ganhos/semana');
    return r.data.ok ? r.data.semana : [];
  },

  pagarTaxa: async () => {
    const r = await api.post('/ganhos/pagar-taxa');
    return r.data;
  },
};

// ── Saques ────────────────────────────────────
export const saquesApi = {
  listar: async () => {
    const r = await api.get('/saques');
    return r.data.ok ? r.data.saques : [];
  },

  solicitar: async (valor: number, chavePix: string) => {
    const r = await api.post('/saques', {
      valor, chave_pix: chavePix, metodo: 'pix' });
    return r.data;
  },
};

// ── Pedidos disponíveis ───────────────────────
export const pedidosDisponiveisApi = {
  listar: async () => {
    const r = await api.get('/pedidos/lista/disponiveis');
    return r.data.ok ? r.data.pedidos : [];
  },

  aceitar: async (id: number) => {
    const r = await api.patch(`/pedidos/${id}/aceitar`);
    return r.data;
  },

  atualizarStatus: async (id: number, status: string) => {
    const r = await api.patch(`/pedidos/${id}/status`, { status });
    return r.data;
  },

  enviarTracking: async (id: number, lat: number, lng: number) => {
    const r = await api.post(`/pedidos/${id}/tracking`, { lat, lng });
    return r.data;
  },
};

export default api;