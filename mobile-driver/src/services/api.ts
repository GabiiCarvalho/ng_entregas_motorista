import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  cadastrar: (data: any) => api.post('/auth/motorista/cadastro', data).then(r => {
    if (r.data.token) AsyncStorage.setItem('token', r.data.token);
    return r.data;
  }),
  login: (telefone: string, senha: string) => api.post('/auth/motorista/login', { telefone, senha }).then(r => {
    if (r.data.token) AsyncStorage.setItem('token', r.data.token);
    return r.data;
  }),
  perfil: () => api.get('/auth/motorista/perfil').then(r => r.data),
  face: (formData: FormData) => api.post('/auth/motorista/face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  uploadDoc: (formData: FormData) => api.post('/auth/motorista/upload-doc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  uploadFoto: (formData: FormData) => api.post('/auth/motorista/upload-foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  atualizarLocalizacao: (lat: number, lng: number, online: boolean) => 
    api.patch('/auth/motorista/localizacao', { lat, lng, online }).then(r => r.data),
  logout: () => AsyncStorage.removeItem('token')
};

export const pedidosApi = {
  disponiveis: () => api.get('/pedidos/disponiveis').then(r => r.data),
  aceitar: (id: number) => api.patch(`/pedidos/${id}/aceitar`).then(r => r.data),
  atualizarStatus: (id: number, status: string) => 
    api.patch(`/pedidos/${id}/status`, { status }).then(r => r.data),
};

export const ganhosApi = {
  hoje: () => api.get('/ganhos/hoje').then(r => r.data),
  semana: () => api.get('/ganhos/semana').then(r => r.data),
  pagarTaxa: () => api.post('/ganhos/pagar-taxa').then(r => r.data),
};

export const saquesApi = {
  listar: () => api.get('/saques').then(r => r.data),
  solicitar: (valor: number, chavePix: string) => 
    api.post('/saques', { valor, chave_pix: chavePix }).then(r => r.data),
};

export default api;