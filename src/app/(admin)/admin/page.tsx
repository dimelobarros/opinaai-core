import { auth } from '@/modules/identity/infrastructure/auth/auth';

import { LogoutButton } from '@/modules/admin/components/logout-button';

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
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}
            >
                <h1>Painel Administrativo</h1>

                <LogoutButton />
            </header>

            <div className={styles.content}>
                <p>
                    Bem-vindo, {session?.user?.name}
                </p>
            </div>
        </main>
    );
}