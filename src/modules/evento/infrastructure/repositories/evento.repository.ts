import { Evento } from "../../domain/evento.entity";

/**
 * Contrato oficial de persistência
 * do módulo Evento.
 */
export interface EventoRepository {
    listar(): Promise<Evento[]>;

    buscarPorId(idEvento: number): Promise<Evento | null>;

    criar(evento: Evento): Promise<Evento>;

    atualizar(evento: Evento): Promise<Evento>;

    excluir(idEvento: number): Promise<void>;
}