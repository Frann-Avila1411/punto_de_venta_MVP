import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import api from '../services/api';
import ConfirmationCard from './ConfirmationCard';

interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: string;
}

interface FormData {
  username: string;
  email: string;
  rol: string;
  password: string;
}

export default function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    rol: 'Recepcion',
    password: ''
  });

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('usuarios/');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setMensaje('No se pudo cargar la lista de usuarios.');
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje(null);

    try {
      await api.post('usuarios/', formData);
      setFormData({ username: '', email: '', rol: 'Recepcion', password: '' });
      setMensaje('Usuario creado con éxito.');
      fetchUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setMensaje('Error al crear el usuario.');
    }
  };

  const actualizarUsuario = async (usuario: Usuario) => {
    setMensaje(null);
    try {
      await api.patch(`usuarios/${usuario.id}/`, {
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol
      });
      setMensaje(`Usuario #${usuario.id} actualizado.`);
      fetchUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setMensaje('Error al actualizar el usuario.');
    }
  };

  const eliminarUsuario = async (id: number) => {
    const usuario = usuarios.find((entry) => entry.id === id) || null;
    if (!usuario) return;

    setUsuarioAEliminar(usuario);
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;

    setEliminandoUsuario(true);
    try {
      await api.delete(`usuarios/${usuarioAEliminar.id}/`);
      setMensaje(`Usuario #${usuarioAEliminar.id} eliminado.`);
      fetchUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setMensaje('Error al eliminar el usuario.');
    } finally {
      setEliminandoUsuario(false);
      setUsuarioAEliminar(null);
    }
  };

  return (
    <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
      <div className="lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="pv-section-title">Usuarios</h2>
          <span className="text-sm text-slate-300">{usuarios.length} cuentas</span>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-[#09c184]/30 bg-[#09c184]/10 p-4 text-[#e5f4ef]">
            {mensaje}
          </div>
        )}

        <div className="pv-table-shell">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="pv-table-head">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-3 text-sm">{usuario.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      value={usuario.username}
                      onChange={(e) => setUsuarios((current) => current.map((entry) => entry.id === usuario.id ? { ...entry, username: e.target.value } : entry))}
                      className="pv-input !mt-0 !rounded-xl !py-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      value={usuario.email}
                      onChange={(e) => setUsuarios((current) => current.map((entry) => entry.id === usuario.id ? { ...entry, email: e.target.value } : entry))}
                      className="pv-input !mt-0 !rounded-xl !py-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={usuario.rol}
                      onChange={(e) => setUsuarios((current) => current.map((entry) => entry.id === usuario.id ? { ...entry, rol: e.target.value } : entry))}
                      className="pv-select !mt-0 !rounded-xl !py-2"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Recepcion">Recepcion</option>
                      <option value="Taller">Taller</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => actualizarUsuario(usuario)}
                      className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => eliminarUsuario(usuario.id)}
                      className="rounded-full bg-[#0c5149] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d192b]"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="pv-section-title mb-6 text-xl">Crear Usuario</h2>
        <div className="pv-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pv-label">Nombre de usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <div>
              <label className="pv-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <div>
              <label className="pv-label">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="pv-select"
              >
                <option value="Administrador">Administrador</option>
                <option value="Recepcion">Recepcion</option>
                <option value="Taller">Taller</option>
              </select>
            </div>

            <div>
              <label className="pv-label">Contraseña temporal</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className="pv-input"
                required
              />
            </div>

            <button
              type="submit"
              className="pv-button-primary w-full"
            >
              Guardar Usuario
            </button>
          </form>
        </div>
      </div>

      <ConfirmationCard
        open={usuarioAEliminar !== null}
        title="Eliminar usuario"
        description={usuarioAEliminar ? `Vas a eliminar a ${usuarioAEliminar.username}. Esta acción no se puede deshacer.` : ''}
        confirmLabel="Sí, eliminar usuario"
        onConfirm={confirmarEliminarUsuario}
        onCancel={() => setUsuarioAEliminar(null)}
        loading={eliminandoUsuario}
      />
    </div>
  );
}