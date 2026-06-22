/**
 * ======================================================
 * ARQUIVO: postgres-evento.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: evento
 * ======================================================
 *
 * RESPONSABILIDADE:
 * Implementação PostgreSQL do contrato EventoRepository.
 *
 * Atua como adaptador entre:
 *
 * Domain
 *    ↓
 * Application
 *    ↓
 * Repository
 *    ↓
 * PostgreSQL
 *
 * Esta camada conhece SQL.
 * O domínio não conhece SQL.
 */

import type {
    PoolClient,
    QueryResultRow
} from "pg";

import { pool }
    from "@/shared/infra/database/connection/postgres";

import {
    Evento,
    EventoStatus
}
    from "../../domain/evento.entity";

import {
    EventoRepository
}
    from "./evento.repository";

/**
 * ======================================================
 * Estrutura retornada pelo PostgreSQL.
 *
 * Banco utiliza snake_case.
 * Domínio utiliza camelCase.
 *
 * O repository é responsável pela conversão.
 * ======================================================
 */
type EventoRow = QueryResultRow & {

    id: number;

    titulo: string;

    descricao: string;

    data_inicio: Date | string;

    data_fim: Date | string;

    local: string;

    status: EventoStatus;

    criado_em: Date | string;

    atualizado_em: Date | string;

};

/**
 * ======================================================
 * Campos reutilizados em consultas SQL.
 * ======================================================
 */
const CAMPOS_EVENTO_SQL = `
    id,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    local,
    status,
    criado_em,
    atualizado_em
`;

/**
 * ======================================================
 * Implementação PostgreSQL do repository.
 * ======================================================
 */
export class PostgresEventoRepository
    implements EventoRepository {

    /**
     * ==================================================
     * Converte uma linha SQL para entidade de domínio.
     * ==================================================
     */
    private mapRow(
        row: EventoRow
    ): Evento {

        return new Evento(

            row.id,

            row.titulo,

            row.descricao,

            new Date(row.data_inicio),

            new Date(row.data_fim),

            row.local,

            row.status,

            new Date(row.criado_em),

            new Date(row.atualizado_em)

        );

    }

    /**
     * ==================================================
     * Lista todos os eventos cadastrados.
     * ==================================================
     */
    async listar(
        client?: PoolClient
    ): Promise<Evento[]> {

        const executor =
            client ?? pool;

        const result =
            await executor.query<EventoRow>(
                `
                SELECT
                    ${CAMPOS_EVENTO_SQL}
                FROM eventos
                ORDER BY data_inicio ASC
                `
            );

        return result.rows.map(
            row => this.mapRow(row)
        );

    }

    /**
     * ==================================================
     * Busca evento pelo ID.
     * ==================================================
     */
    async buscarPorId(
        idEvento: number,
        client?: PoolClient
    ): Promise<Evento | null> {

        const executor =
            client ?? pool;

        const result =
            await executor.query<EventoRow>(
                `
                SELECT
                    ${CAMPOS_EVENTO_SQL}
                FROM eventos
                WHERE id = $1
                LIMIT 1
                `,
                [idEvento]
            );

        if (!result.rows.length) {

            return null;

        }

        return this.mapRow(
            result.rows[0]
        );

    }

    /**
     * ==================================================
     * Persiste um novo evento.
     *
     * O PostgreSQL gera o ID automaticamente.
     * ==================================================
     */
    async criar(
        evento: Evento,
        client?: PoolClient
    ): Promise<Evento> {

        const executor =
            client ?? pool;

        const result =
            await executor.query<EventoRow>(
                `
                INSERT INTO eventos (

                    titulo,
                    descricao,
                    data_inicio,
                    data_fim,
                    local,
                    status,
                    criado_em,
                    atualizado_em

                )
                VALUES (

                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8

                )
                RETURNING
                    ${CAMPOS_EVENTO_SQL}
                `,
                [

                    evento.titulo.trim(),

                    evento.descricao.trim(),

                    evento.dataInicio,

                    evento.dataFim,

                    evento.local.trim(),

                    evento.status,

                    evento.dataCriacao,

                    evento.dataAtualizacao

                ]
            );

        return this.mapRow(
            result.rows[0]
        );

    }

    /**
     * ==================================================
     * Atualiza um evento existente.
     * ==================================================
     */
    async atualizar(
        evento: Evento,
        client?: PoolClient
    ): Promise<Evento> {

        const executor =
            client ?? pool;

        const result =
            await executor.query<EventoRow>(
                `
                UPDATE eventos
                SET

                    titulo = $1,
                    descricao = $2,
                    data_inicio = $3,
                    data_fim = $4,
                    local = $5,
                    status = $6,
                    atualizado_em = $7

                WHERE id = $8

                RETURNING
                    ${CAMPOS_EVENTO_SQL}
                `,
                [

                    evento.titulo,

                    evento.descricao,

                    evento.dataInicio,

                    evento.dataFim,

                    evento.local,

                    evento.status,

                    evento.dataAtualizacao,

                    evento.idEvento

                ]
            );

        return this.mapRow(
            result.rows[0]
        );

    }

    /**
     * ==================================================
     * Exclui um evento.
     * ==================================================
     */
    async excluir(
        idEvento: number,
        client?: PoolClient
    ): Promise<void> {

        const executor =
            client ?? pool;

        await executor.query(
            `
            DELETE FROM eventos
            WHERE id = $1
            `,
            [idEvento]
        );

    }

}