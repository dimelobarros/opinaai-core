-- =====================================================
-- SEED ADMIN USER
-- =====================================================
--
-- Objetivo:
-- Criar usuário administrador inicial.
--
-- IMPORTANTE:
-- Este seed é destinado apenas para:
-- - ambiente local;
-- - desenvolvimento;
-- - bootstrap inicial.
--
-- Em produção:
-- - utilizar variáveis de ambiente;
-- - rotacionar senha imediatamente;
-- - nunca manter credenciais padrão.
--
-- =====================================================

INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    is_active
)
VALUES (
    'Administrador',
    'admin@opinaai.com',

    -- Senha original:
    -- Admin@123
    --
    -- Hash gerado com Argon2.
    '$argon2id$v=19$m=65536,t=3,p=4$QW5vbnltb3VzU2FsdA$4mRk4J7rP9J4O1s5x0y3w3m1J7g5W7l6vN2m3y0z1wY',

    'ADMIN',

    TRUE
)
ON CONFLICT (email)
DO NOTHING;