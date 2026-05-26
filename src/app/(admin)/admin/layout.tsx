import { redirect } from 'next/navigation';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Layout protegido do admin.
 */
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}