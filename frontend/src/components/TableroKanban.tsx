import { useState, useEffect } from 'react';
import api from '../services/api';

interface Detalle {
    id: number;
    item: number;
    cantidad: string;
    precio_unitario: string;
}

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
}

interface Pedido {
    id: number;
    cliente: number;
    canal_origen: string;
    estado: string;
    total_acordado: string;
    anticipo_pagado: string;
    saldo_pendiente: string;
    detalles: Detalle[];
}

const ESTADOS = ['Pendiente', 'En Producción', 'Listo', 'Entregado'];
type ModalTipo = 'anticipo' | 'cierre' | null;

interface Props {
    rolUsuario: string;
}

export default function TableroKanban({ rolUsuario }: Props) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [paginaPorEstado, setPaginaPorEstado] = useState<Record<string, number>>({
        Pendiente: 1,
        'En Producción': 1,
        Listo: 1,
        Entregado: 1,
    });
    const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [montoModal, setMontoModal] = useState('');
    const [mensajeModal, setMensajeModal] = useState<string | null>(null);
    const [cargandoModal, setCargandoModal] = useState(false);
    const itemsPorPagina = 4;
    const esAdmin = rolUsuario === 'Administrador';
    const esRecepcion = rolUsuario === 'Recepcion';
    const esTaller = rolUsuario === 'Taller';

    const fetchPedidos = async () => {
        try {
            const response = await api.get('pedidos/');
            setPedidos(response.data);
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            setError('No se pudieron cargar los pedidos.');
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await api.get('clientes/');
            setClientes(response.data);
        } catch (err) {
            console.error('Error al cargar clientes:', err);
        }
    };

    useEffect(() => {
        fetchPedidos();
        fetchClientes();
    }, []);

    const obtenerCliente = (clienteId: number) => clientes.find((cliente) => cliente.id === clienteId);

    const pedidosPorEstado = (estado: string) => pedidos.filter((pedido) => pedido.estado === estado);

    const pedidosPaginados = (estado: string) => {
        const lista = pedidosPorEstado(estado);
        const paginaActual = paginaPorEstado[estado] ?? 1;
        const inicio = (paginaActual - 1) * itemsPorPagina;
        return {
            items: lista.slice(inicio, inicio + itemsPorPagina),
            totalPaginas: Math.max(1, Math.ceil(lista.length / itemsPorPagina)),
            paginaActual,
        };
    };

    const cambiarPagina = (estado: string, nuevaPagina: number) => {
        setPaginaPorEstado((actual) => ({
            ...actual,
            [estado]: nuevaPagina,
        }));
    };

    const actualizarEstado = async (id: number, nuevoEstado: string) => {
        setError(null);
        try {
            await api.patch(`pedidos/${id}/estado/`, { estado: nuevoEstado });
            fetchPedidos();
        } catch (err: any) {
            const mensajeError = err.response?.data?.error || 'Error al actualizar el estado.';
            setError(mensajeError);
        }
    };

    const abrirModal = (pedido: Pedido, tipo: Exclude<ModalTipo, null>) => {
        setPedidoSeleccionado(pedido);
        setModalTipo(tipo);
        setMontoModal(tipo === 'cierre' ? pedido.saldo_pendiente : '');
        setMensajeModal(null);
        setError(null);
    };

    const cerrarModal = () => {
        setModalTipo(null);
        setPedidoSeleccionado(null);
        setMontoModal('');
        setMensajeModal(null);
        setCargandoModal(false);
    };

    const procesarModal = async () => {
        if (!pedidoSeleccionado || !modalTipo) return;

        const valor = parseFloat(montoModal);
        if (Number.isNaN(valor) || valor < 0 || (modalTipo === 'anticipo' && valor === 0)) {
            setMensajeModal(modalTipo === 'anticipo' ? 'Ingresa un monto válido mayor que cero.' : 'Ingresa un monto válido (no negativo).');
            return;
        }

        setCargandoModal(true);
        setMensajeModal(null);
        try {
            if (modalTipo === 'anticipo') {
                await api.patch(`pedidos/${pedidoSeleccionado.id}/anticipo/`, { anticipo_pagado: valor.toFixed(2) });
            } else {
                await api.patch(`pedidos/${pedidoSeleccionado.id}/cierre/`, { pago_final: valor.toFixed(2) });
            }

            fetchPedidos();
            cerrarModal();
        } catch (err: any) {
            const mensajeApi = err.response?.data?.error || 'Error al procesar el movimiento.';
            setMensajeModal(mensajeApi);
        } finally {
            setCargandoModal(false);
        }
    };

    const renderizarCliente = (pedido: Pedido) => {
        const cliente = obtenerCliente(pedido.cliente);

        return (
            <div className="mb-4 rounded-2xl border border-[#09c184]/20 bg-[#09c184]/10 p-3 text-sm text-slate-100">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#09c184]">Cliente</p>
                {cliente ? (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold text-white">{cliente.nombre}</p>
                        <p className="text-slate-300">Teléfono: {cliente.telefono}</p>
                        <p className="text-slate-400">ID cliente: #{pedido.cliente}</p>
                    </div>
                ) : (
                    <p className="mt-2 text-slate-300">Cliente #{pedido.cliente}</p>
                )}
            </div>
        );
    };

    const renderizarColumna = (estado: string) => {
        const { items, totalPaginas, paginaActual } = pedidosPaginados(estado);

        return (
            <div key={estado} className="flex-1 min-w-[300px] rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <h3 className="mb-4 border-b border-white/10 pb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-100">
                    {estado}
                </h3>

                {estado === 'Pendiente' && (
                    <p className="mb-4 text-xs leading-5 text-slate-300">
                        Aquí verás los pedidos nuevos con el cliente asociado para controlar quién debe anticipo y seguimiento.
                    </p>
                )}

                {estado === 'Listo' && (
                    <p className="mb-4 text-xs leading-5 text-slate-300">
                        Antes de entregar, revisa el cliente del pedido para validar a quién se le va a cerrar la venta.
                    </p>
                )}

                {estado === 'Entregado' && (
                    <p className="mb-4 text-xs leading-5 text-slate-300">
                        Este estado conserva el histórico de cliente para consultas posteriores y control de ventas.
                    </p>
                )}

                <div className="space-y-4">
                    {items.map((pedido) => (
                        <div key={pedido.id} className="rounded-2xl border border-white/10 bg-[#0d192b]/85 p-4 shadow-xl">
                            <div className="mb-2 flex items-start justify-between">
                                <span className="font-bold text-white">Orden #{pedido.id}</span>
                                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">
                                    {pedido.canal_origen}
                                </span>
                            </div>

                            <div className="mb-3 text-sm text-slate-300">
                                <p>Total: ${pedido.total_acordado}</p>
                                <p>Anticipo: ${pedido.anticipo_pagado}</p>
                                <p className="font-medium text-[#09c184]">Saldo: ${pedido.saldo_pendiente}</p>
                            </div>

                            {(estado === 'Pendiente' || estado === 'Listo' || estado === 'Entregado') && renderizarCliente(pedido)}

                            <div className="mt-4 flex flex-col space-y-2">
                                {estado === 'Pendiente' && (
                                    <>
                                        {(esAdmin || esRecepcion) && (
                                            <>
                                                <button
                                                    onClick={() => abrirModal(pedido, 'anticipo')}
                                                    className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                                                >
                                                    Registrar Anticipo
                                                </button>
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'En Producción')}
                                                    className="rounded-full bg-[#0a8967] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d192b]"
                                                >
                                                    Pasar a Producción
                                                </button>
                                                <button
                                                    onClick={() => actualizarEstado(pedido.id, 'Cancelado')}
                                                    className="rounded-full bg-[#0c5149] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d192b]"
                                                >
                                                    Cancelar Pedido
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {estado === 'En Producción' && (
                                    (esAdmin || esTaller) && (
                                        <button
                                            onClick={() => actualizarEstado(pedido.id, 'Listo')}
                                            className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                                        >
                                            Marcar como Listo
                                        </button>
                                    )
                                )}

                                {estado === 'Listo' && (
                                    (esAdmin || esRecepcion) && (
                                        <button
                                            onClick={() => abrirModal(pedido, 'cierre')}
                                            className="rounded-full bg-[#09c184] px-3 py-1 text-xs font-semibold text-[#0d192b] hover:bg-[#0a8967] hover:text-white"
                                        >
                                            Registrar pago final y entregar
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPaginas > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                        <button
                            type="button"
                            onClick={() => cambiarPagina(estado, Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                            type="button"
                            onClick={() => cambiarPagina(estado, Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mx-auto mt-10 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="pv-kicker">Producción</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Tablero de Producción</h2>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
                    {error}
                </div>
            )}

            <div className="flex space-x-4 overflow-x-auto pb-4">
                {ESTADOS.map((estado) => renderizarColumna(estado))}
            </div>

            {modalTipo && pedidoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d192b]/70 px-4 backdrop-blur-sm">
                    <div className="pv-panel-dark w-full max-w-lg border border-white/10 p-6 sm:p-8">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="pv-kicker text-[#09c184]">{modalTipo === 'anticipo' ? 'Anticipo' : 'Cierre de pedido'}</p>
                                <h3 className="mt-2 text-2xl font-bold text-white">Pedido #{pedidoSeleccionado.id}</h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    {modalTipo === 'anticipo'
                                        ? 'Ingresa el monto recibido para registrar el anticipo.'
                                        : `Ingresa exactamente el saldo pendiente para cerrar el pedido: $${pedidoSeleccionado.saldo_pendiente}.`}
                                </p>
                            </div>
                            <button
                                onClick={cerrarModal}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                                aria-label="Cerrar modal"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                    <span>Total acordado</span>
                                    <span className="font-semibold text-white">${pedidoSeleccionado.total_acordado}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                                    <span>Anticipo pagado</span>
                                    <span className="font-semibold text-white">${pedidoSeleccionado.anticipo_pagado}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                                    <span>Saldo pendiente</span>
                                    <span className="font-semibold text-[#09c184]">${pedidoSeleccionado.saldo_pendiente}</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-200">Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={montoModal}
                                    onChange={(e) => setMontoModal(e.target.value)}
                                    className="pv-input-dark"
                                    autoFocus
                                />
                            </div>

                            {mensajeModal && (
                                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {mensajeModal}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button onClick={procesarModal} disabled={cargandoModal} className="pv-button-primary flex-1">
                                    {cargandoModal ? 'Procesando...' : modalTipo === 'anticipo' ? 'Registrar anticipo' : 'Cerrar pedido'}
                                </button>
                                <button onClick={cerrarModal} className="pv-button-secondary flex-1 bg-transparent text-white hover:bg-white/10">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}