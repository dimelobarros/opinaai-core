import { EventoRepository } from "../infrastructure/repositories/evento.repository";

export class ExcluirEventoUseCase {

    constructor(
        private readonly eventoRepository: EventoRepository
    ) { }

    async execute(
        idEvento: number
    ): Promise<void> {

        await this.eventoRepository.excluir(
            idEvento
        );

    }

}