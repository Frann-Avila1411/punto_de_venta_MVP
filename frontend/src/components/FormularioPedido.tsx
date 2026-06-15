import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import api from '../services/api';

interface Cliente {
  id: number;
  nombre: string;
}

interface ItemInventario {
  id: number;
  nombre: string;
  stock_actual: string;
}

interface FormData {
  cliente_id: string;
  canal_origen: string;
  total_acordado: string;
  anticipo_pagado: string;
  item_id: string;
  cantidad: string;
  precio_unitario: string;
}

interface Mensaje {
  tipo: 'exito' | 'error';
  texto: string;
}

export default function FormularioPedido() {
  const [formData, setFormData] = useState<FormData>({
    cliente_id: '',
    canal_origen: 'WhatsApp',
    total_acordado: '',
    anticipo_pagado: '0.00',
    item_id: '',
    cantidad: '',
    precio_unitario: ''
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [clientesRes, inventarioRes] = await Promise.all([
          api.get('clientes/'),
          api.get('inventario/')
        ]);
        setClientes(clientesRes.data);
        setInventario(inventarioRes.data);
      } catch (error) {
        console.error('Error al cargar catálogos:', error);
      }
    };
    fetchCatalogos();
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
      cliente: parseInt(formData.cliente_id),
      canal_origen: formData.canal_origen,
      total_acordado: formData.total_acordado,
      anticipo_pagado: formData.anticipo_pagado,
      detalles: [
        {
          item: parseInt(formData.item_id),
          cantidad: formData.cantidad,
          precio_unitario: formData.precio_unitario
        }
      ]
    };

    try {
      const response = await api.post('pedidos/', payload);
      setMensaje({ tipo: 'exito', texto: `Pedido #${response.data.id} creado con éxito.` });
      setFormData({
        cliente_id: '',
        canal_origen: 'WhatsApp',
        total_acordado: '',
        anticipo_pagado: '0.00',
        item_id: '',
        cantidad: '',
        precio_unitario: ''
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Hubo un error al crear el pedido. Verifica los datos.' });
      console.error(error);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-4xl pv-panel p-8 lg:p-10">
      <div className="mb-8">
        <p className="pv-kicker">Pedidos</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Nuevo Pedido</h2>
        <p className="mt-2 text-sm text-slate-600">Completa primero el cliente y luego el detalle del producto para mantener el flujo claro.</p>
      </div>
      
      {mensaje && (
        <div className={`p-4 mb-4 rounded ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="pv-label">Cliente</label>
          <select
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleChange}
            className="pv-select"
            required
          >
            <option value="">Seleccione un cliente...</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="pv-label">Canal de Origen</label>
          <select 
            name="canal_origen" 
            value={formData.canal_origen} 
            onChange={handleChange}
            className="pv-select"
          >
            <option value="WhatsApp">WhatsApp</option>
            <option value="Facebook">Facebook</option>
            <option value="Tienda">Tienda</option>
          </select>
        </div>

        <div>
          <label className="pv-label">Producto / Ítem</label>
          <select
            name="item_id"
            value={formData.item_id}
            onChange={handleChange}
            className="pv-select"
            required
          >
            <option value="">Seleccione un producto...</option>
            {inventario.map(item => (
              <option key={item.id} value={item.id}>
                {item.nombre} (Stock: {item.stock_actual})
              </option>
            ))}
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
          <label className="pv-label">Precio Unitario</label>
          <input
            type="number"
            step="0.01"
            name="precio_unitario"
            value={formData.precio_unitario}
            onChange={handleChange}
            className="pv-input"
            required
          />
        </div>

        <div>
          <label className="pv-label">Total Acordado</label>
          <input
            type="number"
            step="0.01"
            name="total_acordado"
            value={formData.total_acordado}
            onChange={handleChange}
            className="pv-input"
            required
          />
        </div>

        <div>
          <label className="pv-label">Anticipo Pagado</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="anticipo_pagado"
            value={formData.anticipo_pagado}
            onChange={handleChange}
            className="pv-input"
          />
        </div>
        
        <button 
          type="submit" 
          className="pv-button-primary md:col-span-2"
        >
          Guardar Pedido
        </button>
      </form>
    </div>
  );
}