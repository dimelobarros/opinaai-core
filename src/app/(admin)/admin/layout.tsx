import { redirect } from 'next/navigation';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Layout protegido da área administrativa.
 *
 * Responsável por impedir renderização
 * do admin sem sessão válida.
 */
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  /**
   * Proteção mínima obrigatória.
   */
  if (!session || !session.user) {
    redirect('/login');
  }

  return <>{children}</>;
}