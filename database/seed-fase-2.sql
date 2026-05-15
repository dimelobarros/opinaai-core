/**
 * ARQUIVO: database/seed-fase-2.sql
 * CAMADA: infrastructure
 * MÓDULO: database
 *
 * RESPONSABILIDADE:
 * Popular um banco PostgreSQL limpo com dados demonstrativos do OpinaAi Core.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - limpa tabelas centrais do fluxo público de avaliação;
 * - cria eventos demonstrativos;
 * - cria perguntas objetivas para cada evento;
 * - cria 5 invite tokens ativos por evento;
 * - prepara uma base mínima para testar entrada por token, avaliação e envio.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo permite validar o OpinaAi Core em ambiente limpo,
 * especialmente depois da criação do schema em um PostgreSQL externo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este seed é destrutivo porque usa TRUNCATE com CASCADE.
 * Não executar em banco de produção ou banco com dados reais.
 * Os tokens abaixo são dados demonstrativos e não devem ser tratados
 * como tokens reais de produção.
 */
BEGIN;

-- ======================================================
-- 1. Limpeza da base demonstrativa
-- ======================================================
--
-- ATENÇÃO:
-- Este bloco apaga dados das tabelas centrais do Core.
-- Usar apenas em ambiente local, homologação descartável ou banco demo.
TRUNCATE TABLE respostas CASCADE;

TRUNCATE TABLE avaliacoes CASCADE;

TRUNCATE TABLE participantes_evento CASCADE;

TRUNCATE TABLE device_sessions CASCADE;

TRUNCATE TABLE invite_tokens CASCADE;

TRUNCATE TABLE perguntas CASCADE;

TRUNCATE TABLE eventos CASCADE;

-- ======================================================
-- 2. Eventos demonstrativos
-- ======================================================
--
-- Eventos usados para testar o fluxo público:
-- entrada por token, carregamento de perguntas e envio de respostas.
INSERT INTO
  eventos (
    id,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    local,
    status,
    criado_em,
    atualizado_em
  )
VALUES
  (
    'evt-htmlsem2025',
    'HTML Semântico: Estruturando a Web para Pessoas e Máquinas',
    'Nesta palestra, abordamos como o uso correto das tags HTML semânticas melhora a acessibilidade, o SEO e a manutenção de projetos web. Ideal para desenvolvedores que desejam escrever código mais significativo e profissional.',
    '2026-04-10 19:00:00',
    '2026-04-10 21:00:00',
    'Auditório Front-End',
    'publicado',
    NOW (),
    NOW ()
  ),
  (
    'evt-csslayout2025',
    'CSS Moderno: Layouts Responsivos com Grid e Flexbox',
    'Uma palestra focada na construção de layouts modernos, responsivos e escaláveis utilizando CSS Grid e Flexbox. Serão discutidas decisões de layout, organização visual e boas práticas para diferentes tamanhos de tela.',
    '2026-04-12 19:00:00',
    '2026-04-12 21:00:00',
    'Laboratório Web',
    'publicado',
    NOW (),
    NOW ()
  ),
  (
    'evt-jsestrut2025',
    'JavaScript Limpo: Organização, Estado e Fluxo de Aplicações',
    'Exploramos como estruturar código JavaScript de forma clara e previsível, separando responsabilidades, controlando estado e evitando comportamentos implícitos. Indicada para quem quer evoluir de scripts para aplicações bem arquitetadas.',
    '2026-04-15 19:00:00',
    '2026-04-15 21:00:00',
    'Sala Tech 03',
    'publicado',
    NOW (),
    NOW ()
  ),
  (
    'evt-uxdev2025',
    'UX para Desenvolvedores: Criando Interfaces Claras e Intuitivas',
    'Esta palestra conecta princípios de UX Design com o desenvolvimento front-end, mostrando como pequenas decisões em HTML, CSS e JS impactam diretamente a experiência do usuário e a usabilidade das aplicações.',
    '2026-04-18 19:00:00',
    '2026-04-18 21:00:00',
    'Auditório UX',
    'publicado',
    NOW (),
    NOW ()
  );

-- ======================================================
-- 3. Perguntas demonstrativas
-- ======================================================
--
-- Cada evento recebe 11 perguntas objetivas ativas.
-- A tela pública carrega as perguntas por evento e ordena pelo campo ordem.
INSERT INTO
  perguntas (
    id,
    evento_id,
    enunciado,
    tipo,
    ordem,
    status,
    criado_em,
    atualizado_em
  )
VALUES
  (
    'prg-html-01',
    'evt-htmlsem2025',
    'De forma geral, o conteúdo técnico apresentado foi claro e compreensível?',
    'objetiva',
    1,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-02',
    'evt-htmlsem2025',
    'Os conceitos abordados foram explicados com exemplos práticos e aplicáveis?',
    'objetiva',
    2,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-03',
    'evt-htmlsem2025',
    'O nível técnico da palestra foi adequado ao público participante?',
    'objetiva',
    3,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-04',
    'evt-htmlsem2025',
    'A organização do conteúdo (ordem dos tópicos, progressão dos conceitos) facilitou o entendimento?',
    'objetiva',
    4,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-05',
    'evt-htmlsem2025',
    'O palestrante demonstrou domínio técnico sobre os assuntos apresentados?',
    'objetiva',
    5,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-06',
    'evt-htmlsem2025',
    'Os exemplos de código ou demonstrações práticas ajudaram na compreensão do tema?',
    'objetiva',
    6,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-07',
    'evt-htmlsem2025',
    'O conteúdo apresentado é relevante para sua atuação ou estudos na área de TI?',
    'objetiva',
    7,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-08',
    'evt-htmlsem2025',
    'O ritmo da apresentação foi adequado (nem acelerado demais, nem cansativo)?',
    'objetiva',
    8,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-09',
    'evt-htmlsem2025',
    'Você se sentiu engajado(a) durante a palestra?',
    'objetiva',
    9,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-10',
    'evt-htmlsem2025',
    'Após a palestra, você se sente mais confiante para aplicar os conceitos apresentados?',
    'objetiva',
    10,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-html-11',
    'evt-htmlsem2025',
    'Considerando o conteúdo técnico e a didática, o quanto você recomendaria esta palestra a outro desenvolvedor?',
    'objetiva',
    11,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-01',
    'evt-csslayout2025',
    'De forma geral, o conteúdo técnico apresentado foi claro e compreensível?',
    'objetiva',
    1,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-02',
    'evt-csslayout2025',
    'Os conceitos abordados foram explicados com exemplos práticos e aplicáveis?',
    'objetiva',
    2,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-03',
    'evt-csslayout2025',
    'O nível técnico da palestra foi adequado ao público participante?',
    'objetiva',
    3,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-04',
    'evt-csslayout2025',
    'A organização do conteúdo (ordem dos tópicos, progressão dos conceitos) facilitou o entendimento?',
    'objetiva',
    4,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-05',
    'evt-csslayout2025',
    'O palestrante demonstrou domínio técnico sobre os assuntos apresentados?',
    'objetiva',
    5,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-06',
    'evt-csslayout2025',
    'Os exemplos de código ou demonstrações práticas ajudaram na compreensão do tema?',
    'objetiva',
    6,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-07',
    'evt-csslayout2025',
    'O conteúdo apresentado é relevante para sua atuação ou estudos na área de TI?',
    'objetiva',
    7,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-08',
    'evt-csslayout2025',
    'O ritmo da apresentação foi adequado (nem acelerado demais, nem cansativo)?',
    'objetiva',
    8,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-09',
    'evt-csslayout2025',
    'Você se sentiu engajado(a) durante a palestra?',
    'objetiva',
    9,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-10',
    'evt-csslayout2025',
    'Após a palestra, você se sente mais confiante para aplicar os conceitos apresentados?',
    'objetiva',
    10,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-css-11',
    'evt-csslayout2025',
    'Considerando o conteúdo técnico e a didática, o quanto você recomendaria esta palestra a outro desenvolvedor?',
    'objetiva',
    11,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-01',
    'evt-jsestrut2025',
    'De forma geral, o conteúdo técnico apresentado foi claro e compreensível?',
    'objetiva',
    1,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-02',
    'evt-jsestrut2025',
    'Os conceitos abordados foram explicados com exemplos práticos e aplicáveis?',
    'objetiva',
    2,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-03',
    'evt-jsestrut2025',
    'O nível técnico da palestra foi adequado ao público participante?',
    'objetiva',
    3,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-04',
    'evt-jsestrut2025',
    'A organização do conteúdo (ordem dos tópicos, progressão dos conceitos) facilitou o entendimento?',
    'objetiva',
    4,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-05',
    'evt-jsestrut2025',
    'O palestrante demonstrou domínio técnico sobre os assuntos apresentados?',
    'objetiva',
    5,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-06',
    'evt-jsestrut2025',
    'Os exemplos de código ou demonstrações práticas ajudaram na compreensão do tema?',
    'objetiva',
    6,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-07',
    'evt-jsestrut2025',
    'O conteúdo apresentado é relevante para sua atuação ou estudos na área de TI?',
    'objetiva',
    7,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-08',
    'evt-jsestrut2025',
    'O ritmo da apresentação foi adequado (nem acelerado demais, nem cansativo)?',
    'objetiva',
    8,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-09',
    'evt-jsestrut2025',
    'Você se sentiu engajado(a) durante a palestra?',
    'objetiva',
    9,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-10',
    'evt-jsestrut2025',
    'Após a palestra, você se sente mais confiante para aplicar os conceitos apresentados?',
    'objetiva',
    10,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-js-11',
    'evt-jsestrut2025',
    'Considerando o conteúdo técnico e a didática, o quanto você recomendaria esta palestra a outro desenvolvedor?',
    'objetiva',
    11,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-01',
    'evt-uxdev2025',
    'De forma geral, o conteúdo técnico apresentado foi claro e compreensível?',
    'objetiva',
    1,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-02',
    'evt-uxdev2025',
    'Os conceitos abordados foram explicados com exemplos práticos e aplicáveis?',
    'objetiva',
    2,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-03',
    'evt-uxdev2025',
    'O nível técnico da palestra foi adequado ao público participante?',
    'objetiva',
    3,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-04',
    'evt-uxdev2025',
    'A organização do conteúdo (ordem dos tópicos, progressão dos conceitos) facilitou o entendimento?',
    'objetiva',
    4,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-05',
    'evt-uxdev2025',
    'O palestrante demonstrou domínio técnico sobre os assuntos apresentados?',
    'objetiva',
    5,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-06',
    'evt-uxdev2025',
    'Os exemplos de código ou demonstrações práticas ajudaram na compreensão do tema?',
    'objetiva',
    6,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-07',
    'evt-uxdev2025',
    'O conteúdo apresentado é relevante para sua atuação ou estudos na área de TI?',
    'objetiva',
    7,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-08',
    'evt-uxdev2025',
    'O ritmo da apresentação foi adequado (nem acelerado demais, nem cansativo)?',
    'objetiva',
    8,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-09',
    'evt-uxdev2025',
    'Você se sentiu engajado(a) durante a palestra?',
    'objetiva',
    9,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-10',
    'evt-uxdev2025',
    'Após a palestra, você se sente mais confiante para aplicar os conceitos apresentados?',
    'objetiva',
    10,
    'ativa',
    NOW (),
    NOW ()
  ),
  (
    'prg-ux-11',
    'evt-uxdev2025',
    'Considerando o conteúdo técnico e a didática, o quanto você recomendaria esta palestra a outro desenvolvedor?',
    'objetiva',
    11,
    'ativa',
    NOW (),
    NOW ()
  );

-- ======================================================
-- 4. Invite tokens demonstrativos
-- ======================================================
--
-- Cada evento recebe 5 tokens ativos para validação manual.
--
-- ATENÇÃO:
-- Estes tokens são públicos dentro do repositório se este arquivo for enviado
-- ao GitHub. Portanto, devem ser tratados apenas como dados demo.
INSERT INTO
  invite_tokens (
    id,
    evento_id,
    token,
    status,
    expira_em,
    criado_em,
    atualizado_em
  )
VALUES
  (
    'inv-htmlsem2025-001',
    'evt-htmlsem2025',
    'HTMLSEM2025-ENTRADA-001',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-htmlsem2025-002',
    'evt-htmlsem2025',
    'HTMLSEM2025-ENTRADA-002',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-htmlsem2025-003',
    'evt-htmlsem2025',
    'HTMLSEM2025-ENTRADA-003',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-htmlsem2025-004',
    'evt-htmlsem2025',
    'HTMLSEM2025-ENTRADA-004',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-htmlsem2025-005',
    'evt-htmlsem2025',
    'HTMLSEM2025-ENTRADA-005',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-csslayout2025-001',
    'evt-csslayout2025',
    'CSSLAYOUT2025-ENTRADA-001',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-csslayout2025-002',
    'evt-csslayout2025',
    'CSSLAYOUT2025-ENTRADA-002',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-csslayout2025-003',
    'evt-csslayout2025',
    'CSSLAYOUT2025-ENTRADA-003',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-csslayout2025-004',
    'evt-csslayout2025',
    'CSSLAYOUT2025-ENTRADA-004',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-csslayout2025-005',
    'evt-csslayout2025',
    'CSSLAYOUT2025-ENTRADA-005',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-jsestrut2025-001',
    'evt-jsestrut2025',
    'JSESTRUT2025-ENTRADA-001',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-jsestrut2025-002',
    'evt-jsestrut2025',
    'JSESTRUT2025-ENTRADA-002',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-jsestrut2025-003',
    'evt-jsestrut2025',
    'JSESTRUT2025-ENTRADA-003',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-jsestrut2025-004',
    'evt-jsestrut2025',
    'JSESTRUT2025-ENTRADA-004',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-jsestrut2025-005',
    'evt-jsestrut2025',
    'JSESTRUT2025-ENTRADA-005',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-uxdev2025-001',
    'evt-uxdev2025',
    'UXDEV2025-ENTRADA-001',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-uxdev2025-002',
    'evt-uxdev2025',
    'UXDEV2025-ENTRADA-002',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-uxdev2025-003',
    'evt-uxdev2025',
    'UXDEV2025-ENTRADA-003',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-uxdev2025-004',
    'evt-uxdev2025',
    'UXDEV2025-ENTRADA-004',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  ),
  (
    'inv-uxdev2025-005',
    'evt-uxdev2025',
    'UXDEV2025-ENTRADA-005',
    'ativo',
    '2026-12-31 23:59:59',
    NOW (),
    NOW ()
  );

COMMIT;