'use client';

import { useState } from 'react';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Página de login administrativo.
 */
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      /**
       * Credenciais inválidas.
       */
      if (response?.error) {
        setError('E-mail ou senha inválidos.');
        setLoading(false);
        return;
      }

      /**
       * Login concluído.
       */
      router.push('/admin');
    } catch (error) {
      console.error(error);

      setError('Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded border p-6"
      >
        <h1 className="text-2xl font-bold">
          Login Administrativo
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border p-2"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded border p-2"
        />

        {error && (
          <span className="text-sm text-red-500">
            {error}
          </span>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black p-2 text-white"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}