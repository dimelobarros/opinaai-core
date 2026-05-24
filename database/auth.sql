-- =====================================================
-- AUTH MODULE
-- =====================================================
--
-- Objetivo:
-- Estrutura de autenticação e autorização
-- da aplicação OpinaAI.
--
-- Executar APÓS:
--
--     schema.sql
--
-- Responsabilidades:
-- - identidade administrativa;
-- - autenticação;
-- - autorização;
-- - RBAC inicial;
-- - suporte ao Auth.js;
-- - preparação para evolução SaaS.
--
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================

-- UUID seguro
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- E-mails case-insensitive
CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- FUNÇÃO GLOBAL DE UPDATED_AT
-- =====================================================

/*
 Responsabilidade:
 Atualizar automaticamente o campo updated_at.

 Motivo técnico:
 Evita duplicação de lógica na aplicação
 e padroniza persistência temporal.
*/
CREATE OR REPLACE FUNCTION infra_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABELA USERS
-- =====================================================

/*
 Responsabilidade:
 Representar usuários administrativos autenticáveis.

 Impacto arquitetural:
 Esta tabela será o núcleo da identidade
 da aplicação.
*/
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    email CITEXT NOT NULL,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (
            role IN (
                'ADMIN'
            )
        ),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    deleted_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE(email),

    CONSTRAINT chk_users_email_format
        CHECK (
            position('@' in email) > 1
        )
);

-- =====================================================
-- ÍNDICES
-- =====================================================

/*
 Índice crítico para autenticação.
*/
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

/*
 Preparação para RBAC futuro.
*/
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

/*
 Preparação para filtros administrativos.
*/
CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users(is_active);

/*
 Preparação para soft delete futuro.
*/
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
ON users(deleted_at);

-- =====================================================
-- TRIGGER UPDATED_AT
-- =====================================================

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION infra_update_updated_at_column();

-- =====================================================
-- FIM DO AUTH MODULE
-- =====================================================