import { auth } from '@/modules/identity/infrastructure/auth/auth';

import styles from './page.module.css';

/**
 * Página inicial da área administrativa.
 *
 * Esta página representa o ponto inicial
 * do painel administrativo do sistema.
 */
export default async function AdminPage() {
    const session = await auth();

    return (
        <main className={styles.container}>
            <div className={styles.content}>
                <h1>Painel Administrativo</h1>

                <p>
                    Bem-vindo, {session?.user?.name}
                </p>
            </div>
        </main>
    );
}