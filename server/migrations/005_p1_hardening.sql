-- P1: hardening de integridade + tabela de revogação de tokens.
ALTER TABLE convenios ADD UNIQUE KEY uq_convenios_nome (nome_convenio);
ALTER TABLE agendamentos ADD CONSTRAINT chk_agendamentos_status
  CHECK (status IN ('Agendado', 'Confirmado', 'Chegou', 'Faltou', 'Concluído', 'Cancelado'));
ALTER TABLE lista_espera ADD CONSTRAINT chk_lista_espera_status
  CHECK (status IN ('Aguardando', 'Contatado', 'Agendado', 'Removido'));
ALTER TABLE pacientes ADD KEY ix_pacientes_celular (celular);
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti VARCHAR(191) PRIMARY KEY,
  expires_at DATETIME NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_revoked_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
