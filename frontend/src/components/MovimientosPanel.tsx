import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import api from '../services/api';

interface ItemInventario {
  id: number;
  nombre: string;
}

interface Movimiento {
  id: number;
  item: number;
  tipo_movimiento: string;
  cantidad: string;
  motivo: string;
  fecha: string;
}

interface FormData {
  item: string;
  tipo_movimiento: string;
  cantidad: string;
  motivo: string;
}

export default function MovimientosPanel() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    item: '',
    tipo_movimiento: 'Entrada',
    cantidad: '',
    motivo: ''
  });

  const fetchData = async () => {
    try {
      const [movimientosRes, inventarioRes] = await Promise.all([
        api.get('movimientos/'),
        api.get('inventario/')
      ]);
      setMovimientos(movimientosRes.data);
      setItems(inventarioRes.data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMensaje('No se pudo cargar la lista de movimientos.');
    }
  };

  useEffect(() => {
    fetchData();
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
      await api.post('movimientos/', {
        item: parseInt(formData.item),
        tipo_movimiento: formData.tipo_movimiento,
        cantidad: formData.cantidad,
        motivo: formData.motivo
      });

      setFormData({
        item: '',
        tipo_movimiento: 'Entrada',
        cantidad: '',
        motivo: ''
      });
      setMensaje('Movimiento registrado con éxito.');
      fetchData();
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      setMensaje('Error al registrar el movimiento.');
    }
  };

  return (
    <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(330px,0.9fr)]">
      <div className="lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="pv-section-title">Movimientos de Inventario</h2>
          <span className="text-sm text-slate-300">{movimientos.length} registros</span>
        </div>

        <div className="pv-table-shell">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="pv-table-head">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ítem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
              {movimientos.map((movimiento) => {
                const item = items.find((entry) => entry.id === movimiento.item);
                return (
                  <tr key={movimiento.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{movimiento.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item?.nombre ?? `#${movimiento.item}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{movimiento.tipo_movimiento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{movimiento.cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movimiento.motivo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="pv-section-title mb-6 text-xl">Registrar Movimiento</h2>
        <div className="pv-panel p-6">
          {mensaje && (
            <div className="mb-4 rounded-2xl border border-[#09c184]/30 bg-[#09c184]/10 p-3 text-sm text-[#0c5149]">
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pv-label">Producto / Ítem</label>
              <select
                name="item"
                value={formData.item}
                onChange={handleChange}
                className="pv-select"
                required
              >
                <option value="">Seleccione un ítem...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pv-label">Tipo de Movimiento</label>
              <select
                name="tipo_movimiento"
                value={formData.tipo_movimiento}
                onChange={handleChange}
                className="pv-select"
                required
              >
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </div>

            <div>
              <label className="pv-label">Cantidad</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <div>
              <label className="pv-label">Motivo</label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                className="pv-input"
                required
              />
            </div>

            <button
              type="submit"
              className="pv-button-primary w-full"
            >
              Guardar Movimiento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}