CREATE DATABASE IF NOT EXISTS ng_motorista CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ng_motorista;

-- MOTORISTAS
CREATE TABLE IF NOT EXISTS motoristas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    foto_url VARCHAR(500),
    face_ok BOOLEAN DEFAULT FALSE,
    face_verificada_em DATETIME,
    status ENUM('pendente','ativo','inativo','bloqueado') DEFAULT 'pendente',
    online BOOLEAN DEFAULT FALSE,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    ultima_localizacao DATETIME,
    avaliacao DECIMAL(3,2) DEFAULT 5.00,
    total_corridas INT DEFAULT 0,
    total_ganhos DECIMAL(10,2) DEFAULT 0.00,
    cnh_status ENUM('pendente','aprovado','reprovado') DEFAULT 'pendente',
    crlv_status ENUM('pendente','aprovado','reprovado') DEFAULT 'pendente',
    refresh_token VARCHAR(500),
    ultimo_login DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_telefone (telefone),
    INDEX idx_status (status),
    INDEX idx_online (online)
) ENGINE=InnoDB;

-- PEDIDOS (visão do motorista)
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    motorista_id INT,
    status ENUM('aguardando','aceito','coletando','em_rota','entregue','cancelado') DEFAULT 'aguardando',
    coleta_endereco VARCHAR(500) NOT NULL,
    coleta_lat DECIMAL(10,8),
    coleta_lng DECIMAL(11,8),
    entrega_endereco VARCHAR(500) NOT NULL,
    entrega_lat DECIMAL(10,8),
    entrega_lng DECIMAL(11,8),
    valor_base DECIMAL(10,2) NOT NULL,
    valor_adicional_espera DECIMAL(10,2) DEFAULT 0.00,
    valor_total DECIMAL(10,2),
    forma_pagamento ENUM('pix','dinheiro') NOT NULL,
    aceito_em DATETIME,
    chegada_coleta_em DATETIME,
    saida_coleta_em DATETIME,
    entregue_em DATETIME,
    cancelado_em DATETIME,
    cancelado_por ENUM('usuario','motorista','sistema'),
    tempo_espera_segundos INT DEFAULT 0,
    carencia_espera_segundos INT DEFAULT 300,
    valor_por_minuto_extra DECIMAL(5,2) DEFAULT 0.80,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
    INDEX idx_motorista (motorista_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- CORRIDAS
CREATE TABLE IF NOT EXISTS corridas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id INT NOT NULL,
    pedido_id INT,
    cliente_nome VARCHAR(255) NOT NULL,
    coleta VARCHAR(500) NOT NULL,
    entrega VARCHAR(500) NOT NULL,
    distancia_km DECIMAL(5,2) DEFAULT 0,
    duracao_min INT DEFAULT 0,
    valor DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(20),
    status ENUM('concluida','cancelada') DEFAULT 'concluida',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE,
    INDEX idx_motorista (motorista_id),
    INDEX idx_data (criado_em)
) ENGINE=InnoDB;

-- GANHOS DIÁRIOS
CREATE TABLE IF NOT EXISTS ganhos_diarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id INT NOT NULL,
    data DATE NOT NULL,
    bruto DECIMAL(10,2) DEFAULT 0.00,
    taxa_app DECIMAL(10,2) DEFAULT 0.00,
    liquido DECIMAL(10,2) DEFAULT 0.00,
    num_corridas INT DEFAULT 0,
    taxa_paga BOOLEAN DEFAULT FALSE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_motorista_data (motorista_id, data)
) ENGINE=InnoDB;

-- SAQUES
CREATE TABLE IF NOT EXISTS saques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    metodo ENUM('pix') DEFAULT 'pix',
    chave_pix VARCHAR(255) NOT NULL,
    status ENUM('pendente','processando','concluido','rejeitado') DEFAULT 'pendente',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    processado_em DATETIME,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE,
    INDEX idx_motorista (motorista_id)
) ENGINE=InnoDB;

-- DOCUMENTOS
CREATE TABLE IF NOT EXISTS documentos_motorista (
    id INT AUTO_INCREMENT PRIMARY KEY,
    motorista_id INT NOT NULL,
    tipo ENUM('cnh','crlv','foto_perfil') NOT NULL,
    url VARCHAR(500) NOT NULL,
    nome_original VARCHAR(255),
    status ENUM('pendente','aprovado','reprovado') DEFAULT 'pendente',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE
) ENGINE=InnoDB;