import { Evento } from "../domain/evento.entity";
import { EventoRepository } from "../infrastructure/repositories/evento.repository";

export class ListarEventoUseCase {

    constructor(
        private readonly eventoRepository: EventoRepository
    ) { }

    async execute(): Promise<Evento[]> {

        return this.eventoRepository.listar();

    }

}