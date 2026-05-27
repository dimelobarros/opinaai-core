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
    -- admin@12345
    --
    -- Hash gerado com Argon2.
    '$argon2id$v=19$m=65536,t=3,p=4$99H5o/B55Px7lYaSI4Fi9A$pm5Q+0YTd6oOLKTAvgweZFPYRotd0JT1NO35eHdvCsw',

    'ADMIN',

    TRUE
)
ON CONFLICT (email)
DO NOTHING;