# OpinaAi Core

OpinaAi Core é o núcleo público funcional do sistema OpinaAi.

Esta versão contém apenas o fluxo real de avaliação por token, com validação antifraude, persistência em PostgreSQL e envio de respostas.

O objetivo deste repositório é manter somente o que está funcional e em uso no sistema atual, preparando o projeto para GitHub, Vercel e continuidade com equipe.

---

## Escopo desta versão

Esta primeira versão migrada inclui:

- entrada pública por token;
- geração de fingerprint do dispositivo;
- validação antifraude;
- criação ou retomada de avaliação;
- carregamento de perguntas do evento;
- envio de respostas;
- comentário final opcional;
- bloqueio de avaliação já concluída;
- conexão com PostgreSQL;
- health check do banco.

Rotas principais:

```txt
/entrar-avaliacao
/avaliacao/[avaliacaoId]
/api/avaliacao/entrar
/api/avaliacao/[avaliacaoId]/perguntas
/api/avaliacao/enviar
/api/health/db
```
