// mobile-user/src/types/index.ts

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  data_nascimento?: string;
  foto_url?: string;
  face_verified: boolean;
  cep?: string;
  numero?: string;
  complemento?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  motorista_id?: number;
  coleta: string;
  coleta_lat?: number;
  coleta_lng?: number;
  entrega: string;
  entrega_lat?: number;
  entrega_lng?: number;
  valor: number;
  forma_pagamento: 'pix' | 'dinheiro';
  status: PedidoStatus;
  avaliacao_nota?: number;
  motorista_nome?: string;
  motorista_foto?: string;
  motorista_avaliacao?: number;
  criado_em: string;
}

export type PedidoStatus = 
  | 'aguardando' 
  | 'aceito' 
  | 'coletando' 
  | 'em_rota' 
  | 'entregue' 
  | 'cancelado';

export interface TrackingData {
  status: string;
  coleta: EnderecoCoordenada;
  entrega: EnderecoCoordenada;
  motorista?: MotoristaTracking;
  chegou_em?: string;
  adicional_espera?: number;
}

export interface EnderecoCoordenada {
  endereco: string;
  lat?: number;
  lng?: number;
}

export interface MotoristaTracking {
  nome: string;
  foto?: string;
  avaliacao: number;
  telefone?: string;
  total_corridas?: number;
  lat?: number;
  lng?: number;
  placa?: string;
  veiculo_modelo?: string;
  veiculo_cor?: string;
  tempo_min?: number;
  distancia_km?: string;
}

export interface Motorista {
  id: number;
  nome: string;
  avaliacao: number;
  foto_url?: string;
  lat: number;
  lng: number;
}