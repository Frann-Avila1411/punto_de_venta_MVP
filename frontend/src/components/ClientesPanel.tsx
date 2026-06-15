import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import api from '../services/api';
import ConfirmationCard from './ConfirmationCard';

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  fecha_registro: string;
}

interface FormData {
  nombre: string;
  telefono: string;
}

export default function ClientesPanel() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [eliminandoCliente, setEliminandoCliente] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    telefono: ''
  });

  const fetchClientes = async () => {
    try {
      const response = await api.get('clientes/');
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setMensaje('No se pudo cargar la lista de clientes.');
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje(null);

    try {
      await api.post('clientes/', formData);
      setFormData({ nombre: '', telefono: '' });
      setMensaje('Cliente creado con éxito.');
      fetchClientes();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setMensaje('Error al crear el cliente.');
    }
  };

  const actualizarCliente = async (cliente: Cliente) => {
    setMensaje(null);

    try {
      await api.patch(`clientes/${cliente.id}/`, {
        nombre: cliente.nombre,
        telefono: cliente.telefono
      });
      setMensaje(`Cliente #${cliente.id} actualizado.`);
      fetchClientes();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      setMensaje('Error al actualizar el cliente.');
    }
  };

  const eliminarCliente = async (id: number) => {
    const cliente = clientes.find((entry) => entry.id === id) || null;
    if (!cliente) return;

    setClienteAEliminar(cliente);
  };

  const confirmarEliminarCliente = async () => {
    if (!clienteAEliminar) return;

    setEliminandoCliente(true);
    try {
      await api.delete(`clientes/${clienteAEliminar.id}/`);
      setMensaje(`Cliente #${clienteAEliminar.id} eliminado.`);
      fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      setMensaje('Error al eliminar el cliente.');
    } finally {
      setEliminandoCliente(false);
      setClienteAEliminar(null);
    }
  };

  return (
    <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="pv-section-title">Clientes</h2>
          <span className="text-sm text-slate-300">{clientes.length} registrados</span>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-[#09c184]/30 bg-[#09c184]/10 p-4 text-[#0c5149]">
            {mensaje}
          </div>
        )}

        <div className="pv-table-shell">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="pv-table-head">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-4 py-3 text-sm">{cliente.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      value={cliente.nombre}
                      onChange={(e) => setClientes((current) => current.map((entry) => entry.id === cliente.id ? { ...entry, nombre: e.target.value } : entry))}
                      className="pv-input !mt-0 !rounded-xl !py-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      value={cliente.telefono}
                      onChange={(e) => setClientes((current) => current.map((entry) => entry.id === cliente.id ? { ...entry, telefono: e.target.value } : entry))}
                      className="pv-input !mt-0 !rounded-xl !py-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(cliente.fecha_registro).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => actualizarCliente(cliente)}
                      className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => eliminarCliente(cliente.id)}
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
        <h2 className="pv-section-title mb-6 text-xl">Nuevo Cliente</h2>
        <div className="pv-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pv-label">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <div>
              <label className="pv-label">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <button
              type="submit"
              className="pv-button-primary w-full"
            >
              Guardar Cliente
            </button>
          </form>
        </div>
      </div>

      <ConfirmationCard
        open={clienteAEliminar !== null}
        title="Eliminar cliente"
        description={clienteAEliminar ? `Vas a eliminar a ${clienteAEliminar.nombre}. Esta acción no se puede deshacer.` : ''}
        confirmLabel="Sí, eliminar cliente"
        onConfirm={confirmarEliminarCliente}
        onCancel={() => setClienteAEliminar(null)}
        loading={eliminandoCliente}
      />
    </div>
  );
}