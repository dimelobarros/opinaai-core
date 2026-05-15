/**
 * ARQUIVO: database/schema.sql
 * CAMADA: infrastructure
 * MÓDULO: database
 *
 * RESPONSABILIDADE:
 * Definir o schema PostgreSQL base do OpinaAi Core.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - cria as tabelas centrais do fluxo público de avaliação;
 * - cria vínculos entre eventos, perguntas, tokens, dispositivos e avaliações;
 * - define constraints de integridade do fluxo antifraude;
 * - define unicidades críticas para impedir duplicidade indevida;
 * - cria índices úteis para consultas do fluxo público.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo representa a estrutura mínima de banco necessária para o
 * OpinaAi Core funcionar em um ambiente limpo, incluindo GitHub/Vercel com
 * PostgreSQL externo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este schema não deve conter dados reais, senhas, dumps ou tokens de produção.
 * Os campos token e device_fingerprint seguem o modelo funcional atual em texto.
 * Uma evolução futura pode migrar esses valores para hash, mas isso exige
 * migration própria, ajuste de seeds, ajuste de repositories e cuidado com
 * dados existentes.
 */
-- ======================================================
-- 1. Eventos
-- ======================================================
--
-- Representa o evento avaliado pelo sistema.
-- No Core atual, o participante não escolhe o evento diretamente:
-- o evento é descoberto a partir do invite token usado na entrada.
CREATE TABLE
  IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    local TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('rascunho', 'publicado', 'encerrado')),
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
  );

-- ======================================================
-- 2. Perguntas
-- ======================================================
--
-- Representa as perguntas vinculadas a um evento.
-- A rota pública de perguntas carrega apenas perguntas ativas
-- do evento associado à avaliação.
CREATE TABLE
  IF NOT EXISTS perguntas (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('objetiva', 'subjetiva')),
    ordem INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ativa', 'inativa')),
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
  );

-- ======================================================
-- 3. Invite tokens
-- ======================================================
--
-- Representa o token público digitado pelo participante.
-- O token identifica o evento e inicia o fluxo antifraude.
CREATE TABLE
  IF NOT EXISTS invite_tokens (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('ativo', 'utilizado', 'expirado')),
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL
  );

-- ======================================================
-- 4. Device sessions
-- ======================================================
--
-- Representa a sessão técnica do dispositivo associada ao token.
--
-- REGRA:
-- O mesmo token usado no mesmo fingerprint deve apontar para
-- a mesma device session.
CREATE TABLE
  IF NOT EXISTS device_sessions (
    id TEXT PRIMARY KEY,
    invite_token_id TEXT NOT NULL REFERENCES invite_tokens (id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ativa', 'bloqueada', 'encerrada')),
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL,
    CONSTRAINT uq_device_session_token_fingerprint UNIQUE (invite_token_id, device_fingerprint)
  );

-- ======================================================
-- 5. Participantes do evento
-- ======================================================
--
-- Representa o participante anônimo materializado dentro do evento.
--
-- REGRA:
-- A avaliação pertence ao participante_evento, não diretamente
-- ao token nem à device session.
CREATE TABLE
  IF NOT EXISTS participantes_evento (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
    invite_token_id TEXT NOT NULL REFERENCES invite_tokens (id) ON DELETE CASCADE,
    device_session_id TEXT NOT NULL REFERENCES device_sessions (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('ativo', 'bloqueado', 'finalizado')),
    criado_em TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP NOT NULL,
    -- Protege a tríade antifraude clássica.
    CONSTRAINT uq_participante_evento_antifraude UNIQUE (evento_id, invite_token_id, device_session_id),
    -- Protege a regra: 1 token = 1 uso.
    CONSTRAINT uq_participante_evento_invite_token UNIQUE (invite_token_id)
  );

-- ======================================================
-- 6. Avaliações
-- ======================================================
--
-- Representa o ato avaliativo de um participante materializado.
--
-- REGRA:
-- Cada participante_evento pode ter no máximo uma avaliação.
CREATE TABLE
  IF NOT EXISTS avaliacoes (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
    participante_evento_id TEXT NOT NULL REFERENCES participantes_evento (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (
      status IN ('em_andamento', 'concluida', 'cancelada')
    ),
    comentario_final TEXT NOT NULL DEFAULT '',
    criada_em TIMESTAMP NOT NULL,
    atualizada_em TIMESTAMP NOT NULL,
    CONSTRAINT uq_avaliacao_participante_evento UNIQUE (participante_evento_id)
  );

-- ======================================================
-- 7. Respostas
-- ======================================================
--
-- Representa as respostas enviadas dentro de uma avaliação.
--
-- REGRA:
-- Uma avaliação só pode ter uma resposta por pergunta.
CREATE TABLE
  IF NOT EXISTS respostas (
    id TEXT PRIMARY KEY,
    avaliacao_id TEXT NOT NULL REFERENCES avaliacoes (id) ON DELETE CASCADE,
    pergunta_id TEXT NOT NULL REFERENCES perguntas (id) ON DELETE CASCADE,
    valor NUMERIC(10, 2) NOT NULL,
    comentario TEXT NOT NULL DEFAULT '',
    criada_em TIMESTAMP NOT NULL,
    atualizada_em TIMESTAMP NOT NULL,
    CONSTRAINT uq_resposta_avaliacao_pergunta UNIQUE (avaliacao_id, pergunta_id)
  );

-- ======================================================
-- 8. Índices auxiliares
-- ======================================================
--
-- Índices voltados às consultas reais do OpinaAi Core:
-- - entrada por token;
-- - busca de perguntas ativas por evento;
-- - materialização antifraude;
-- - retomada/conclusão de avaliação;
-- - busca de respostas por avaliação.
CREATE INDEX IF NOT EXISTS idx_perguntas_evento_status_ordem ON perguntas (evento_id, status, ordem);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens (token);

CREATE INDEX IF NOT EXISTS idx_device_sessions_invite_token_id ON device_sessions (invite_token_id);

CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint ON device_sessions (device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_participantes_evento_evento_id ON participantes_evento (evento_id);

CREATE INDEX IF NOT EXISTS idx_participantes_evento_device_session_id ON participantes_evento (device_session_id);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_participante_evento_id ON avaliacoes (participante_evento_id);

CREATE INDEX IF NOT EXISTS idx_respostas_avaliacao_id ON respostas (avaliacao_id);