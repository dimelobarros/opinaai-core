# OpinaAi Core

### Projeto Integrador — Programador Full Stack | SENAC-RN

O **OpinaAi Core** é uma aplicação web Full Stack desenvolvida como **Projeto Integrador para conclusão do curso Programador Full Stack do SENAC-RN**.

O projeto foi construído com o objetivo de aplicar, de forma integrada, competências desenvolvidas ao longo da formação em desenvolvimento front-end, back-end, banco de dados, serviços web e integração entre aplicações.

A solução implementa um fluxo de avaliação de eventos no qual participantes acessam um questionário por meio de token, respondem às perguntas disponíveis e têm suas avaliações persistidas em banco de dados PostgreSQL.

## Demonstração

### Entrada na avaliação

![Tela de entrada por token do OpinaAi](docs/screenshots/opinaai-entrada.png)

### Avaliação em andamento

![Tela de avaliação do OpinaAi](docs/screenshots/opinaai-avaliacao.png)

### Comentários

![Tela de comentários finais do OpinaAi](docs/screenshots/opinaai-comentarios.png)

### Avaliação concluída

![Tela de conclusão da avaliação do OpinaAi](docs/screenshots/opinaai-concluida.png)

---

## Sobre o projeto

O **OpinaAi** foi concebido como uma solução para coleta estruturada de avaliações de participantes de eventos.

Nesta versão pública, denominada **OpinaAi Core**, foi preservado o núcleo funcional do sistema responsável pelo processo de avaliação.

O fluxo contempla desde a entrada do participante até a persistência final das respostas, incluindo regras para controle da utilização dos tokens, identificação técnica do dispositivo, criação ou retomada de avaliações e bloqueio de avaliações já concluídas.

O projeto representa a aplicação prática e integrada dos conhecimentos adquiridos durante a formação Full Stack no SENAC-RN.

---

## Principais funcionalidades

- Entrada pública em uma avaliação por token
- Geração de fingerprint do dispositivo como sinal técnico de controle
- Validação de utilização do token
- Controle de participação por dispositivo e evento
- Criação de novas avaliações
- Retomada de avaliações em andamento
- Bloqueio de avaliações já concluídas
- Carregamento dinâmico das perguntas vinculadas ao evento
- Avaliação por escala de 1 a 5 estrelas
- Navegação sequencial entre perguntas
- Indicador de progresso da avaliação
- Comentário final opcional
- Envio das respostas para o back-end
- Persistência das respostas em PostgreSQL
- Atualização do status da avaliação
- Uso de transações para conclusão da avaliação
- Health check da conexão com o banco de dados

---

## Tecnologias utilizadas

| Área | Tecnologias |
|---|---|
| Front-end | React, Next.js, TypeScript, Tailwind CSS |
| Back-end | Next.js Route Handlers, TypeScript, Node.js |
| Banco de dados | PostgreSQL, SQL |
| Persistência | `pg` |
| Versionamento | Git e GitHub |
| Gerenciamento de pacotes | NPM |
| Qualidade | ESLint, TypeScript Type Checking |

---

## Arquitetura

O projeto foi organizado buscando separar responsabilidades entre interface, regras de aplicação, domínio e infraestrutura.

A estrutura principal segue a organização:

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
```

Dentro dos módulos, as responsabilidades podem ser distribuídas em áreas como:

```text
application/
domain/
infrastructure/
components/
```

Essa organização permite manter as regras de negócio separadas da interface e dos mecanismos de persistência.

As rotas HTTP funcionam como pontos de entrada da aplicação e delegam as decisões do fluxo para casos de uso e repositories responsáveis pelas respectivas regras.

---

## Separação de responsabilidades

A aplicação procura manter cada parte do sistema responsável por uma função específica.

### Interface

Responsável por:

- receber dados do usuário;
- apresentar perguntas;
- controlar a navegação entre etapas;
- exibir feedback visual;
- enviar requisições para a API.

### API

Responsável por:

- receber requisições HTTP;
- validar contratos mínimos de entrada;
- delegar operações para a camada de aplicação;
- retornar respostas apropriadas para a interface.

### Application

Responsável por:

- orquestrar os casos de uso;
- aplicar regras do fluxo de avaliação;
- decidir entre criação, retomada ou bloqueio;
- coordenar repositories e serviços.

### Domain

Responsável por representar conceitos e estruturas pertencentes ao domínio da aplicação.

### Infrastructure

Responsável por:

- comunicação com PostgreSQL;
- execução de queries;
- repositories;
- gerenciamento de conexões;
- transações.

---

## Fluxo principal da aplicação

```text
Entrada por token
      ↓
Identificação técnica do dispositivo
      ↓
Validação do token
      ↓
Validação do contexto da participação
      ↓
Materialização do participante
      ↓
Criação ou retomada da avaliação
      ↓
Carregamento das perguntas
      ↓
Avaliação por estrelas
      ↓
Comentário final
      ↓
Envio das respostas
      ↓
Persistência transacional
      ↓
Conclusão da avaliação
```

---

## Regras implementadas

O fluxo atual contempla diferentes regras relacionadas ao controle da participação e integridade da avaliação.

### Controle do token

Existe controle para impedir a criação indevida de múltiplas participações utilizando o mesmo token.

O sistema verifica se o token já foi anteriormente relacionado a um participante e utiliza essa informação na decisão de permitir, retomar ou bloquear a avaliação.

### Controle por dispositivo

O sistema utiliza um fingerprint do dispositivo como um sinal técnico dentro da estratégia atual de controle da participação.

Esse identificador auxilia na verificação de tentativas de novas avaliações para o mesmo evento.

### Retomada da avaliação

Quando uma avaliação existente permanece com status de andamento e o contexto da participação é reconhecido, o sistema pode permitir sua continuidade.

### Avaliação concluída

Uma avaliação concluída permanece bloqueada para novo envio pelo fluxo normal da aplicação.

### Integridade no banco de dados

Além das verificações realizadas pela aplicação, o PostgreSQL utiliza constraints para reforçar regras estruturais e reduzir possibilidades de duplicidade indevida.

---

## Banco de dados

A aplicação utiliza **PostgreSQL** como sistema de persistência.

O schema principal está disponível em:

```text
database/schema.sql
```

O modelo contempla as seguintes entidades:

- Eventos
- Perguntas
- Invite tokens
- Sessões de dispositivo
- Participantes de eventos
- Avaliações
- Respostas

---

## Estrutura de dados

### Eventos

Representam os eventos que podem receber avaliações.

### Perguntas

Representam as perguntas vinculadas a cada evento.

### Invite tokens

Representam os códigos utilizados pelos participantes para entrar no fluxo de avaliação.

### Device sessions

Representam sessões técnicas relacionadas ao dispositivo utilizado durante a participação.

### Participantes do evento

Representam o participante materializado dentro do contexto de determinado evento.

### Avaliações

Representam o ato avaliativo associado ao participante.

### Respostas

Armazenam as respostas fornecidas às perguntas da avaliação.

---

## Integridade dos dados

O banco utiliza diferentes mecanismos de integridade, incluindo:

- Chaves primárias
- Chaves estrangeiras
- Constraints `UNIQUE`
- Constraints `CHECK`
- Índices
- Relacionamentos entre entidades
- Regras de exclusão com referências
- Controle de unicidade entre entidades relacionadas

Essas regras complementam as validações realizadas pela aplicação.

---

## Dados demonstrativos

O repositório possui um conjunto de dados destinado a testes e demonstrações:

```text
database/seed-fase-2.sql
```

Esse arquivo permite preparar uma base com eventos, perguntas e tokens destinados ao teste do fluxo público.

> **Atenção:** o seed contém operações destrutivas de limpeza de tabelas e deve ser utilizado somente em ambientes de desenvolvimento, teste ou demonstração.

> Não deve ser executado em banco de produção ou em ambientes contendo dados reais importantes.

---

## Transações

A conclusão de uma avaliação envolve diferentes operações de persistência que precisam permanecer consistentes.

Por isso, o projeto utiliza transações PostgreSQL.

O fluxo simplificado é:

```text
BEGIN
  ↓
Persistência das respostas
  ↓
Atualização do comentário final
  ↓
Atualização do status da avaliação
  ↓
COMMIT
```

Caso uma falha ocorra durante as operações:

```text
ROLLBACK
```

A conexão utilizada pela transação é liberada ao final da operação, independentemente de sucesso ou falha.

Essa abordagem reduz o risco de uma avaliação ficar apenas parcialmente persistida.

---

## Rotas principais

### Interface

```text
/entrar-avaliacao
/avaliacao/[avaliacaoId]
```

### API

```text
POST /api/avaliacao/entrar

GET /api/avaliacao/[avaliacaoId]/perguntas

POST /api/avaliacao/enviar

GET /api/health/db
```

---

## Entrada na avaliação

A página:

```text
/entrar-avaliacao
```

é responsável por iniciar a experiência do participante.

O usuário informa o token recebido e a interface envia para a API:

- código do token;
- fingerprint do dispositivo.

A decisão sobre permitir ou bloquear a entrada é realizada no lado servidor.

Quando a entrada é autorizada, o participante é direcionado para a avaliação correspondente.

---

## Avaliação

A página:

```text
/avaliacao/[avaliacaoId]
```

é responsável pela realização da avaliação.

A interface:

1. identifica a avaliação pela URL;
2. solicita as perguntas ao back-end;
3. apresenta uma pergunta por vez;
4. recebe notas de 1 a 5 estrelas;
5. controla o progresso do participante;
6. permite retornar à etapa anterior;
7. apresenta um campo de comentário final;
8. envia as respostas para a API;
9. apresenta o estado final após a conclusão.

---

## Componente de avaliação por estrelas

O projeto possui um componente responsável pela seleção visual das notas.

A escala utilizada é:

```text
★
★★
★★★
★★★★
★★★★★
```

O componente possui comportamento de interação por hover e seleção.

Também utiliza atributos de acessibilidade como:

```text
role="radiogroup"
role="radio"
aria-label
aria-checked
```

---

## API de entrada

A rota:

```text
POST /api/avaliacao/entrar
```

recebe os dados necessários para iniciar o fluxo.

Entre suas responsabilidades estão:

- leitura segura do body;
- validação dos dados mínimos;
- normalização de token e fingerprint;
- delegação da decisão para a camada de aplicação;
- retorno da ação apropriada para o front-end.

Os possíveis comportamentos incluem:

```text
criada
continuada
bloqueada
```

---

## Carregamento das perguntas

A rota:

```text
GET /api/avaliacao/[avaliacaoId]/perguntas
```

localiza a avaliação e identifica o evento correspondente.

Depois, carrega apenas as perguntas ativas vinculadas ao evento.

As perguntas são retornadas respeitando sua ordem definida no banco de dados.

---

## Envio da avaliação

A rota:

```text
POST /api/avaliacao/enviar
```

recebe:

- identificador da avaliação;
- respostas;
- comentário final opcional.

O servidor realiza validações antes de persistir os dados.

A conclusão utiliza uma transação PostgreSQL para manter as operações relacionadas dentro de uma única unidade lógica.

---

## Conexão com PostgreSQL

A conexão com o banco utiliza o pacote:

```text
pg
```

A aplicação trabalha com um pool de conexões PostgreSQL.

A configuração é obtida pela variável de ambiente:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Credenciais reais não são armazenadas diretamente no código-fonte.

---

## Variáveis de ambiente

O repositório possui o arquivo:

```text
.env.example
```

que serve como referência de configuração.

Exemplo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Para execução local, crie um arquivo:

```text
.env.local
```

e informe os dados do seu ambiente PostgreSQL.

---

## Configuração do projeto

Clone o repositório:

```bash
git clone https://github.com/dimelobarros/opinaai-core.git
```

Entre no diretório:

```bash
cd opinaai-core
```

Instale as dependências:

```bash
npm install
```

Configure a variável de ambiente:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Prepare o banco utilizando:

```text
database/schema.sql
```

Caso queira trabalhar com dados demonstrativos em um ambiente descartável, consulte:

```text
database/seed-fase-2.sql
```

Depois execute:

```bash
npm run dev
```

A aplicação ficará disponível no endereço informado pelo ambiente de desenvolvimento do Next.js.

---

## Scripts disponíveis

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Produção

```bash
npm run start
```

### Lint

```bash
npm run lint
```

### Verificação de tipos

```bash
npm run typecheck
```

---

## Verificações recomendadas

Antes de uma entrega, podem ser executados:

```bash
npm run lint
npm run typecheck
npm run build
```

Essas verificações ajudam a identificar problemas relacionados à qualidade do código, tipagem e processo de construção da aplicação.

---

## Segurança e integridade

A versão atual utiliza diferentes mecanismos para contribuir com a segurança e integridade da aplicação.

Entre eles estão:

- Queries SQL parametrizadas
- Variáveis de ambiente para dados de conexão
- Proteção de arquivos `.env` pelo `.gitignore`
- Constraints de integridade no PostgreSQL
- Controle de utilização de tokens
- Controle técnico por dispositivo
- Respostas HTTP dinâmicas com `Cache-Control: no-store`
- Transações para operações compostas
- Separação entre interface, regras de aplicação e persistência
- Tratamento de respostas de erro sem necessidade de acesso direto do front-end ao banco

---

## Fingerprint do dispositivo

O sistema gera um fingerprint simples a partir de características disponibilizadas pelo navegador.

Entre os sinais utilizados estão informações relacionadas a:

- navegador;
- idioma;
- fuso horário;
- resolução da tela;
- profundidade de cor;
- plataforma;
- capacidade de hardware;
- suporte a toque.

O fingerprint deve ser entendido apenas como um **sinal técnico utilizado pela estratégia atual de controle da avaliação**.

Ele não representa uma identidade absoluta de uma pessoa ou dispositivo.

---

## Limitações conhecidas

Como projeto em evolução, a versão atual possui pontos que poderão ser aprimorados futuramente.

Entre eles estão:

- ampliação das validações server-side;
- aprimoramento do vínculo entre avaliação e sessão autorizada;
- evolução da estratégia de proteção de tokens;
- evolução da estratégia de armazenamento do fingerprint;
- ampliação da cobertura de regras relacionadas aos estados da avaliação;
- testes automatizados;
- integração contínua;
- aprimoramentos de segurança;
- melhorias contínuas de arquitetura;
- evolução da experiência do usuário.

Esses pontos fazem parte do processo de evolução técnica do projeto.

---

## Contexto acadêmico

O **OpinaAi Core foi desenvolvido como Projeto Integrador do curso Programador Full Stack do SENAC-RN**.

O Projeto Integrador foi realizado como etapa de conclusão da formação, permitindo reunir diferentes competências desenvolvidas durante o curso em uma aplicação funcional.

Entre os conhecimentos aplicados estão:

- planejamento de aplicações web;
- estruturação de soluções para web;
- desenvolvimento front-end;
- desenvolvimento back-end;
- banco de dados;
- modelagem e manipulação de dados;
- serviços web;
- integração entre front-end e back-end;
- integração com banco de dados;
- desenvolvimento de funcionalidades;
- organização de aplicações;
- versionamento de código;
- preparação de aplicações para publicação.

O projeto representa, portanto, a consolidação prática dos conhecimentos desenvolvidos durante a formação Full Stack.

---

## Relação com a formação

Durante o curso Programador Full Stack, foram trabalhadas diferentes etapas do desenvolvimento de aplicações web.

O OpinaAi permitiu reunir essas etapas dentro de um único projeto.

```text
Planejamento
      ↓
Estruturação da solução
      ↓
Front-end
      ↓
Back-end
      ↓
Banco de dados
      ↓
Serviços Web
      ↓
Integração
      ↓
Aplicação funcional
```

Dessa forma, o Projeto Integrador funciona como uma demonstração prática das competências desenvolvidas ao longo da formação.

---

## Objetivo do repositório

O objetivo deste repositório é disponibilizar uma versão pública e funcional do núcleo do OpinaAi para:

- demonstrar competências em desenvolvimento Full Stack;
- documentar a evolução do projeto;
- permitir análise do código-fonte;
- consolidar conhecimentos adquiridos durante a formação;
- servir como projeto de portfólio profissional;
- permitir futuras evoluções técnicas.

---

## Status do projeto

**Em evolução.**

O núcleo público da aplicação está funcional e poderá receber melhorias progressivamente conforme novos conhecimentos e práticas forem incorporados.

Entre as próximas possibilidades de evolução estão:

- testes automatizados;
- validações adicionais no back-end;
- evolução da segurança;
- melhorias na experiência do usuário;
- aprimoramento da documentação;
- integração contínua;
- evolução arquitetural;
- novas funcionalidades.

---

## Aprendizados

O desenvolvimento do OpinaAi permitiu consolidar conhecimentos relacionados a diferentes áreas do desenvolvimento de software.

Entre os principais aprendizados estão:

- construção de aplicações Full Stack;
- integração entre interface e back-end;
- desenvolvimento de APIs;
- aplicação de regras de negócio;
- modelagem de banco de dados;
- utilização de PostgreSQL;
- SQL parametrizado;
- transações;
- organização modular;
- separação de responsabilidades;
- TypeScript;
- React;
- Next.js;
- tratamento de estados da aplicação;
- controle de fluxo;
- versionamento com Git e GitHub.

---

## Autor

**Diego de Melo**

Desenvolvedor Full Stack Júnior

**Stack:**  
JavaScript • TypeScript • React • Next.js • Node.js • PostgreSQL

**LinkedIn:** 
[Diego de Melo](https://www.linkedin.com/in/diegodemelodev)

**GitHub:**  
[@dimelobarros](https://github.com/dimelobarros)

---

### Projeto Integrador — Programador Full Stack | SENAC-RN
