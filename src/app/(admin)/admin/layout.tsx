import { redirect } from 'next/navigation';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Layout protegido da área administrativa.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  /**
   * Usuário não autenticado.
   */
  if (!session || !session.user) {
    redirect('/login');
  }

  /**
   * Usuário sem permissão administrativa.
   */
  if (session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <>{children}</>;
}