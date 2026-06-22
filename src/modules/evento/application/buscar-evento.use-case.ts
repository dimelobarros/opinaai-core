import { Evento } from "../domain/evento.entity";
import { EventoRepository } from "../infrastructure/repositories/evento.repository";

export class BuscarEventoUseCase {

    constructor(
        private readonly eventoRepository: EventoRepository
    ) { }

    async execute(
        idEvento: number
    ): Promise<Evento | null> {

        return this.eventoRepository.buscarPorId(
            idEvento
        );

    }

}