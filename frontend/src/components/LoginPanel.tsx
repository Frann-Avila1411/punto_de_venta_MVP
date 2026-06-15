'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api, { clearAuthToken, getAuthToken, setAuthToken } from '../services/api';

interface LoginUser {
  id: number;
  username: string;
  email: string;
  rol: string;
}

interface LoginResponse {
  token: string;
  user: LoginUser;
}

export default function LoginPanel() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const validarSesion = async () => {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        await api.get('auth/me/');
        router.replace('/dashboard');
      } catch (sessionError) {
        console.error('Sesión previa inválida:', sessionError);
        clearAuthToken();
      }
    };

    validarSesion();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>('auth/login/', {
        username,
        password,
      });

      setAuthToken(response.data.token);
      router.replace('/dashboard');
    } catch (loginError) {
      console.error('Error al iniciar sesión:', loginError);
      setError('Credenciales inválidas o usuario sin permisos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
      <div className="pv-panel-dark w-full max-w-lg p-10">
        <div className="mb-8">
          <p className="pv-kicker text-[#09c184]">Punto de Venta</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Acceso restringido</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Ingresa con un usuario autorizado para acceder al tablero, clientes e inventario.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pv-input-dark"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pv-input-dark"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pv-button-primary w-full text-base"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}