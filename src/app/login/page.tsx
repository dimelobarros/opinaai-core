import { redirect } from 'next/navigation';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

import LoginForm from './login-form';

/**
 * Página de login.
 *
 * Caso o usuário já esteja autenticado,
 * redireciona diretamente para o painel.
 */
export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/admin');
  }

  return <LoginForm />;
}