import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import api from '../services/api';
import ConfirmationCard from './ConfirmationCard';

interface ItemInventario {
  id: number;
  nombre: string;
  tipo: string;
  stock_actual: string;
  stock_minimo: string;
}

interface MovimientoData {
  item: string;
  tipo_movimiento: string;
  cantidad: string;
  motivo: string;
}

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

interface Props {
  rolUsuario?: string;
  puedeRegistrarMovimientos?: boolean;
}

interface ItemFormData {
  nombre: string;
  tipo: string;
  stock_actual: string;
  stock_minimo: string;
}

export default function VistaInventario({ rolUsuario = '', puedeRegistrarMovimientos = true }: Props) {
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [itemAEliminar, setItemAEliminar] = useState<ItemInventario | null>(null);
  const [eliminandoItem, setEliminandoItem] = useState(false);
  const [formData, setFormData] = useState<MovimientoData>({
    item: '',
    tipo_movimiento: 'Entrada',
    cantidad: '',
    motivo: ''
  });
  const [itemFormData, setItemFormData] = useState<ItemFormData>({
    nombre: '',
    tipo: 'Materia Prima',
    stock_actual: '0.00',
    stock_minimo: '0.00'
  });
  const [itemEnEdicion, setItemEnEdicion] = useState<number | null>(null);
  const esAdmin = rolUsuario === 'Administrador';

  const fetchInventario = async () => {
    try {
      const response = await api.get('inventario/');
      setInventario(response.data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el inventario.' });
    }
  };

  useEffect(() => {
    fetchInventario();
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

    const payload = {
      item: parseInt(formData.item),
      tipo_movimiento: formData.tipo_movimiento,
      cantidad: formData.cantidad,
      motivo: formData.motivo
    };

    try {
      await api.post('movimientos/', payload);
      setMensaje({ tipo: 'exito', texto: 'Movimiento registrado con éxito.' });
      setFormData({
        item: '',
        tipo_movimiento: 'Entrada',
        cantidad: '',
        motivo: ''
      });
      fetchInventario();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar el movimiento.' });
      console.error(error);
    }
  };

  const handleItemChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setItemFormData({
      ...itemFormData,
      [e.target.name]: e.target.value
    });
  };

  const limpiarFormularioItem = () => {
    setItemFormData({
      nombre: '',
      tipo: 'Materia Prima',
      stock_actual: '0.00',
      stock_minimo: '0.00'
    });
    setItemEnEdicion(null);
  };

  const guardarItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje(null);

    const payload = {
      nombre: itemFormData.nombre,
      tipo: itemFormData.tipo,
      stock_actual: itemFormData.stock_actual,
      stock_minimo: itemFormData.stock_minimo
    };

    try {
      if (itemEnEdicion) {
        await api.patch(`inventario/${itemEnEdicion}/`, payload);
        setMensaje({ tipo: 'exito', texto: `Ítem #${itemEnEdicion} actualizado con éxito.` });
      } else {
        await api.post('inventario/', payload);
        setMensaje({ tipo: 'exito', texto: 'Ítem creado con éxito.' });
      }

      limpiarFormularioItem();
      fetchInventario();
    } catch (error) {
      console.error('Error al guardar ítem:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar el ítem.' });
    }
  };

  const editarItem = (item: ItemInventario) => {
    setItemEnEdicion(item.id);
    setItemFormData({
      nombre: item.nombre,
      tipo: item.tipo,
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo
    });
    setMensaje(null);
  };

  const eliminarItem = async (id: number) => {
    const item = inventario.find((entry) => entry.id === id) || null;
    if (!item) return;

    setItemAEliminar(item);
  };

  const confirmarEliminarItem = async () => {
    if (!itemAEliminar) return;

    setEliminandoItem(true);
    try {
      await api.delete(`inventario/${itemAEliminar.id}/`);
      setMensaje({ tipo: 'exito', texto: `Ítem #${itemAEliminar.id} eliminado.` });
      fetchInventario();
      if (itemEnEdicion === itemAEliminar.id) {
        limpiarFormularioItem();
      }
    } catch (error) {
      console.error('Error al eliminar ítem:', error);
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el ítem.' });
    } finally {
      setEliminandoItem(false);
      setItemAEliminar(null);
    }
  };

  return (
    <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
      <div className={esAdmin ? 'md:col-span-2' : 'md:col-span-3'}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="pv-section-title">Estado del Inventario</h2>
          <span className="text-sm text-slate-300">{inventario.length} ítems</span>
        </div>
        
        <div className="pv-table-shell">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="pv-table-head">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
                {esAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
              {inventario.map((item) => {
                const stockAlerta = parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo);
                return (
                  <tr key={item.id} className={stockAlerta ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tipo}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${stockAlerta ? 'text-red-600' : 'text-green-600'}`}>
                      {item.stock_actual}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stock_minimo}</td>
                    {esAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => editarItem(item)}
                          className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarItem(item.id)}
                          className="rounded-full bg-[#0c5149] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d192b]"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {esAdmin && (
        <div>
          <h2 className="pv-section-title mb-6 text-xl">
            {itemEnEdicion ? 'Editar Ítem' : 'Nuevo Ítem'}
          </h2>
          <div className="pv-panel p-6">
            {mensaje && (
              <div className={`p-3 mb-4 rounded text-sm ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={guardarItem} className="space-y-4">
              <div>
                <label className="pv-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={itemFormData.nombre}
                  onChange={handleItemChange}
                  className="pv-input"
                  required
                />
              </div>

              <div>
                <label className="pv-label">Tipo</label>
                <select
                  name="tipo"
                  value={itemFormData.tipo}
                  onChange={handleItemChange}
                  className="pv-select"
                  required
                >
                  <option value="Materia Prima">Materia Prima</option>
                  <option value="Producto Terminado">Producto Terminado</option>
                </select>
              </div>

              <div>
                <label className="pv-label">Stock Actual</label>
                <input
                  type="number"
                  step="0.01"
                  name="stock_actual"
                  value={itemFormData.stock_actual}
                  onChange={handleItemChange}
                  className="pv-input"
                  required
                />
              </div>

              <div>
                <label className="pv-label">Stock Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  name="stock_minimo"
                  value={itemFormData.stock_minimo}
                  onChange={handleItemChange}
                  className="pv-input"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="pv-button-primary flex-1"
                >
                  {itemEnEdicion ? 'Actualizar Ítem' : 'Guardar Ítem'}
                </button>
                {itemEnEdicion && (
                  <button
                    type="button"
                    onClick={limpiarFormularioItem}
                    className="pv-button-secondary flex-1"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {puedeRegistrarMovimientos && (
        <div>
          <h2 className="pv-section-title mb-6 text-xl">Registrar Movimiento</h2>
          <div className="pv-panel p-6">
            {mensaje && (
              <div className={`p-3 mb-4 rounded text-sm ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {mensaje.texto}
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
                  {inventario.map(item => (
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
                  <option value="Entrada">Entrada (Abastecimiento)</option>
                  <option value="Salida">Salida (Ajuste o Merma)</option>
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
                  placeholder="Ej. Compra a proveedor"
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
      )}

      <ConfirmationCard
        open={itemAEliminar !== null}
        title="Eliminar ítem de inventario"
        description={itemAEliminar ? `Vas a eliminar ${itemAEliminar.nombre}. Si este ítem tiene movimientos o pedidos asociados, el sistema puede impedir la eliminación.` : ''}
        confirmLabel="Sí, eliminar ítem"
        onConfirm={confirmarEliminarItem}
        onCancel={() => setItemAEliminar(null)}
        loading={eliminandoItem}
      />
    </div>
  );
}