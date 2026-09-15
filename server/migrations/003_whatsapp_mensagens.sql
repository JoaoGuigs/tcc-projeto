CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  direcao ENUM('entrada', 'saida') NOT NULL,
  texto TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'enviada',
  erro VARCHAR(1000) NULL,
  lida TINYINT NOT NULL DEFAULT 0,
  message_id VARCHAR(191) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mensagens_message_id (message_id),
  KEY ix_mensagens_numero_data (numero, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
