/**
 * ======================================================
 * DOMAIN: Evento
 * ======================================================
 *
 * Entidade principal do módulo de eventos.
 *
 * RESPONSABILIDADE:
 * Representar um evento dentro do domínio.
 *
 * REGRAS:
 * - título mínimo de 3 caracteres;
 * - descrição mínima de 10 caracteres;
 * - data início não pode ser maior que data fim;
 * - data fim não pode ser menor que data início;
 * - status deve ser válido.
 *
 * OBSERVAÇÃO:
 * O ID é gerado pelo PostgreSQL (BIGSERIAL).
 * Por isso ele pode ser null durante a criação
 * da entidade e receber valor após persistência.
 */

export type EventoStatus =
    | "rascunho"
    | "publicado"
    | "encerrado";

export class Evento {

    constructor(

        private readonly _idEvento: number | null,

        private _titulo: string,

        private _descricao: string,

        private _dataInicio: Date,

        private _dataFim: Date,

        private _local: string,

        private _status: EventoStatus,

        private readonly _dataCriacao: Date,

        private _dataAtualizacao: Date

    ) {}

    /**
     * ======================================================
     * GETTERS
     * ======================================================
     */

    get idEvento(): number | null {
        return this._idEvento;
    }

    get titulo(): string {
        return this._titulo;
    }

    get descricao(): string {
        return this._descricao;
    }

    get dataInicio(): Date {
        return this._dataInicio;
    }

    get dataFim(): Date {
        return this._dataFim;
    }

    get local(): string {
        return this._local;
    }

    get status(): EventoStatus {
        return this._status;
    }

    get dataCriacao(): Date {
        return this._dataCriacao;
    }

    get dataAtualizacao(): Date {
        return this._dataAtualizacao;
    }

    /**
     * ======================================================
     * SETTERS COM VALIDAÇÃO
     * ======================================================
     */

    set titulo(novoTitulo: string) {

        if (!novoTitulo || novoTitulo.trim().length < 3) {

            throw new Error(
                "O título deve possuir no mínimo 3 caracteres."
            );

        }

        this._titulo = novoTitulo.trim();

        this.atualizarData();

    }

    set descricao(novaDescricao: string) {

        if (
            !novaDescricao ||
            novaDescricao.trim().length < 10
        ) {

            throw new Error(
                "A descrição deve possuir no mínimo 10 caracteres."
            );

        }

        this._descricao = novaDescricao.trim();

        this.atualizarData();

    }

    set dataInicio(novaDataInicio: Date) {

        if (novaDataInicio > this._dataFim) {

            throw new Error(
                "A data de início não pode ser maior que a data fim."
            );

        }

        this._dataInicio = novaDataInicio;

        this.atualizarData();

    }

    set dataFim(novaDataFim: Date) {

        if (novaDataFim < this._dataInicio) {

            throw new Error(
                "A data fim não pode ser menor que a data início."
            );

        }

        this._dataFim = novaDataFim;

        this.atualizarData();

    }

    set local(novoLocal: string) {

        if (
            !novoLocal ||
            novoLocal.trim().length < 3
        ) {

            throw new Error(
                "O local informado é inválido."
            );

        }

        this._local = novoLocal.trim();

        this.atualizarData();

    }

    set status(novoStatus: EventoStatus) {

        this._status = novoStatus;

        this.atualizarData();

    }

    /**
     * ======================================================
     * MÉTODO PRIVADO
     * ======================================================
     */

    private atualizarData(): void {

        this._dataAtualizacao = new Date();

    }

}