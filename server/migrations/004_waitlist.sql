CREATE TABLE IF NOT EXISTS lista_espera (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id BIGINT UNSIGNED NOT NULL,
  profissional_id BIGINT UNSIGNED NOT NULL,
  data_preferida DATE NULL,
  periodo VARCHAR(30) NOT NULL DEFAULT 'Qualquer horário',
  observacoes VARCHAR(500) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Aguardando',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lista_espera_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_lista_espera_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
  KEY ix_lista_espera_profissional_status (profissional_id, status, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
