# OpinaAi Core

### Projeto Integrador — Programador Full Stack | SENAC-RN

O **OpinaAi Core** é uma aplicação web Full Stack desenvolvida como **Projeto Integrador para conclusão do curso Programador Full Stack do SENAC-RN**.

O projeto foi construído com o objetivo de aplicar, de forma integrada, competências desenvolvidas ao longo da formação em desenvolvimento front-end, back-end, banco de dados, serviços web e integração entre aplicações.

A solução implementa um fluxo de avaliação de eventos no qual participantes acessam um questionário por meio de token, respondem às perguntas disponíveis e têm suas avaliações persistidas em banco de dados PostgreSQL.

---

## Sobre o projeto

O OpinaAi foi concebido como uma solução para coleta estruturada de avaliações de participantes de eventos.

Nesta versão pública, denominada **OpinaAi Core**, foi preservado o núcleo funcional do sistema responsável pelo processo de avaliação.

O fluxo contempla desde a entrada do participante até a persistência final das respostas, incluindo regras para controle de utilização dos tokens e retomada de avaliações em andamento.

---

## Principais funcionalidades

- entrada pública em uma avaliação por token;
- geração de fingerprint do dispositivo como sinal técnico de controle;
- validação de utilização do token;
- controle de participação por dispositivo e evento;
- criação de novas avaliações;
- retomada de avaliações em andamento;
- bloqueio de avaliações já concluídas;
- carregamento dinâmico das perguntas vinculadas ao evento;
- avaliação por escala de 1 a 5 estrelas;
- navegação sequencial entre perguntas;
- comentário final opcional;
- envio e persistência das respostas;
- persistência dos dados em PostgreSQL;
- uso de transações para conclusão da avaliação;
- health check da conexão com o banco de dados.

---

## Tecnologias

| Área | Tecnologias |
|---|---|
| Front-end | React, Next.js, TypeScript, Tailwind CSS |
| Back-end | Next.js Route Handlers, TypeScript, Node.js |
| Banco de dados | PostgreSQL, SQL |
| Persistência | `pg` |
| Versionamento | Git e GitHub |
| Qualidade | ESLint, TypeScript Type Checking |

---

## Arquitetura

O projeto foi organizado buscando separar responsabilidades entre interface, regras de aplicação, domínio e infraestrutura.

```text
src/
├── app/
│   ├── api/
│   ├── avaliacao/
│   └── entrar-avaliacao/
│
├── modules/
│   ├── avaliacao/
│   ├── device-session/
│   ├── invite-token/
│   ├── participante-evento/
│   └── resposta/
│
└── shared/
    ├── components/
    └── infra/
