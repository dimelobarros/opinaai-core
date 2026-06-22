import { Evento, EventoStatus } from "../domain/evento.entity";
import { EventoRepository } from "../infrastructure/repositories/evento.repository";

/**
 * Caso de uso responsável pela criação
 * de novos eventos.
 *
 * Esta camada não conhece PostgreSQL.
 * Apenas trabalha com regras da aplicação.
 */
export type CriarEventoInput = {
    titulo: string;
    descricao: string;
    dataInicio: Date;
    dataFim: Date;
    local: string;
    status: EventoStatus;
};

export class CriarEventoUseCase {

    constructor(
        private readonly eventoRepository: EventoRepository
    ) { }

    async execute(
        input: CriarEventoInput
    ): Promise<Evento> {

        const agora = new Date();

        const evento = new Evento(
            null,
            input.titulo,
            input.descricao,
            input.dataInicio,
            input.dataFim,
            input.local,
            input.status,
            agora,
            agora
        );

        return this.eventoRepository.criar(evento);

    }

}