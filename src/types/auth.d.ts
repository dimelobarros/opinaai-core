import { DefaultSession } from 'next-auth';

import 'next-auth';
import 'next-auth/jwt';

/**
 * Tipagem global da autenticação.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}