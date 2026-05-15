/**
 * ARQUIVO: src/modules/invite-token/domain/invite-token.types.ts
 * CAMADA: domain
 * MÓDULO: invite-token
 *
 * RESPONSABILIDADE:
 * Definir os tipos e a entidade de domínio do invite token.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define os status possíveis de um invite token no fluxo atual;
 * - representa um token de convite como entidade de domínio;
 * - vincula o token ao evento correspondente;
 * - armazena o código textual do token;
 * - armazena status, expiração e timestamps;
 * - expõe getters para leitura segura dos atributos;
 * - permite alteração controlada de token, status, expiração e atualização.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo define o modelo central do convite usado na entrada pública
 * do OpinaAi Core. Todo fluxo de avaliação começa pela localização e validação
 * de um invite token.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo pertence ao domínio e não deve depender de banco, HTTP,
 * Next.js, React ou detalhes de infraestrutura. Ele representa apenas
 * a forma conceitual do invite token dentro do sistema.
 */

/**
 * ======================================================
 * 1. Status do invite token
 * ======================================================
 *
 * Define os estados aceitos pelo domínio atual do token.
 *
 * REGRAS:
 * - ativo: token disponível para iniciar o fluxo;
 * - utilizado: token já consumido ou indisponível para novo uso;
 * - expirado: token fora da janela temporal de validade.
 *
 * OBSERVAÇÃO DE MIGRAÇÃO:
 * Não adicionar novos status aqui sem auditar antes o schema,
 * os seeds, os repositories e os dados reais já persistidos.
 */
export type InviteTokenStatus = "ativo" | "utilizado" | "expirado";

/**
 * ======================================================
 * 2. Entidade InviteToken
 * ======================================================
 *
 * Representa o convite que autoriza a entrada pública de um participante
 * no fluxo de avaliação de um evento.
 *
 * DECISÃO ARQUITETURAL:
 * O token textual é o identificador público digitado pelo participante.
 * O id é o identificador interno usado pelos demais vínculos do fluxo
 * antifraude, como device_session e participante_evento.
 *
 * OBSERVAÇÃO DE SEGURANÇA:
 * O modelo atual mantém o token textual conforme o schema existente.
 * Uma evolução futura pode migrar para hash de token, mas isso exige
 * auditoria conjunta de banco, seeds, fluxo de entrada e dados existentes.
 */
export class InviteToken {
  constructor(
    private _id: string,
    private _eventoId: string,
    private _token: string,
    private _status: InviteTokenStatus,
    private _expiraEm: string,
    private _criadoEm: string,
    private _atualizadoEm: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get eventoId(): string {
    return this._eventoId;
  }

  get token(): string {
    return this._token;
  }

  set token(token: string) {
    this._token = token;
  }

  get status(): InviteTokenStatus {
    return this._status;
  }

  set status(status: InviteTokenStatus) {
    this._status = status;
  }

  get expiraEm(): string {
    return this._expiraEm;
  }

  set expiraEm(expiraEm: string) {
    this._expiraEm = expiraEm;
  }

  get criadoEm(): string {
    return this._criadoEm;
  }

  get atualizadoEm(): string {
    return this._atualizadoEm;
  }

  set atualizadoEm(atualizadoEm: string) {
    this._atualizadoEm = atualizadoEm;
  }
}
