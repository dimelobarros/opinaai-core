import { Evento } from "../domain/evento.entity";
import { EventoRepository } from "../infrastructure/repositories/evento.repository";

/**
 * Responsável por persistir alterações
 * realizadas em um evento existente.
 */
export class AtualizarEventoUseCase {

    constructor(
        private readonly eventoRepository: EventoRepository
    ) { }

    async execute(
        evento: Evento
    ): Promise<Evento> {

        if (evento.idEvento === null) {

            throw new Error(
                "Evento sem ID. Não é possível atualizar."
            );

        }

        return this.eventoRepository.atualizar(
            evento
        );

    }

}