'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioPedido from '../components/FormularioPedido';
import TableroKanban from '../components/TableroKanban';
import VistaInventario from '../components/VistaInventario';
import MovimientosPanel from '../components/MovimientosPanel';
import UsuariosPanel from '../components/UsuariosPanel';
import ClientesPanel from '../components/ClientesPanel';
import api, { clearAuthToken, getAuthToken } from '../services/api';

interface UsuarioAutenticado {
  id: number;
  username: string;
  email: string;
  rol: string;
}

const permisosPorRol: Record<string, {
  formulario: boolean;
  clientes: boolean;
  inventario: boolean;
  movimientos: boolean;
  usuarios: boolean;
}> = {
  Administrador: {
    formulario: true,
    clientes: true,
    inventario: true,
    movimientos: true,
    usuarios: true,
  },
  Recepcion: {
    formulario: true,
    clientes: true,
    inventario: true,
    movimientos: true,
    usuarios: false,
  },
  Taller: {
    formulario: false,
    clientes: false,
    inventario: true,
    movimientos: false,
    usuarios: false,
  },
};

export default function DashboardShell() {
  const [vistaActiva, setVistaActiva] = useState<'formulario' | 'tablero' | 'inventario' | 'movimientos' | 'usuarios' | 'clientes'>('tablero');
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const router = useRouter();
  const permisos = permisosPorRol[usuario?.rol ?? ''] ?? permisosPorRol.Taller;

  useEffect(() => {
    const validarSesion = async () => {
      const token = getAuthToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const response = await api.get<UsuarioAutenticado>('auth/me/');
        setUsuario(response.data);
      } catch (error) {
        console.error('Sesión inválida:', error);
        clearAuthToken();
        router.replace('/login');
      } finally {
        setCargandoAuth(false);
      }
    };

    validarSesion();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('auth/logout/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      clearAuthToken();
      router.replace('/login');
    }
  };

  if (cargandoAuth) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        Validando sesión...
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <main className="min-h-screen text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#0d192b]/85 shadow-2xl backdrop-blur-xl">
        <div className="pv-shell">
          <div className="flex items-center justify-between gap-6 py-4 overflow-x-auto">
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setVistaActiva('tablero')}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'tablero'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Tablero Kanban
              </button>
              <button
                onClick={() => setVistaActiva('formulario')}
                disabled={!permisos.formulario}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'formulario'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40'
                }`}
              >
                Nuevo Pedido
              </button>
              <button
                onClick={() => setVistaActiva('inventario')}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'inventario'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Inventario
              </button>
              <button
                onClick={() => setVistaActiva('clientes')}
                disabled={!permisos.clientes}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'clientes'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setVistaActiva('movimientos')}
                disabled={!permisos.movimientos}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'movimientos'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40'
                }`}
              >
                Movimientos
              </button>
              <button
                onClick={() => setVistaActiva('usuarios')}
                disabled={!permisos.usuarios}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  vistaActiva === 'usuarios'
                    ? 'bg-[#09c184] text-[#0d192b] shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40'
                }`}
              >
                Usuarios
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{usuario.username}</p>
                <p className="text-xs text-slate-300">{usuario.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-[#0a8967] hover:text-white"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pv-shell py-8 pb-12">
        {vistaActiva === 'formulario' && permisos.formulario && <FormularioPedido />}
        {vistaActiva === 'tablero' && <TableroKanban rolUsuario={usuario.rol} />}
        {vistaActiva === 'inventario' && <VistaInventario rolUsuario={usuario.rol} puedeRegistrarMovimientos={permisos.movimientos} />}
        {vistaActiva === 'clientes' && permisos.clientes && <ClientesPanel />}
        {vistaActiva === 'movimientos' && permisos.movimientos && <MovimientosPanel />}
        {vistaActiva === 'usuarios' && permisos.usuarios && <UsuariosPanel />}
      </div>
    </main>
  );
}