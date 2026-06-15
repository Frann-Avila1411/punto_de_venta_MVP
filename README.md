# Sistema de Gestión de Pedidos e Inventario (MVP)

Este proyecto es un Producto Mínimo Viable (MVP) desarrollado como una solución integral para una empresa dedicada a la publicidad, marketing y venta de productos promocionales (tazas, lapiceros, camisetas, vallas publicitarias, viniles, etc.).

## Contexto y Problema a Resolver

Actualmente, la empresa cliente enfrenta múltiples deficiencias operativas:
- **Gestión de pedidos manual:** Los pedidos llegan por WhatsApp, Facebook o en tienda física, se anotan en papel y luego se pasan a Excel, generando cuellos de botella y margen de error.
- **Falta de control de inventario:** No existe un sistema formal para registrar las existencias, entradas y salidas de materia prima o productos terminados.
- **Riesgo financiero:** Los pedidos suelen enviarse a producción sin garantizar el pago de un anticipo, lo que representa pérdidas si el cliente abandona el trabajo.
- **Falta de trazabilidad:** Es difícil conocer el estado real de un pedido sin consultar físicamente al taller.

## Solución Propuesta

El sistema es una **aplicación web interna simplificada** que digitaliza el ingreso de pedidos, gestiona visualmente los estados de producción mediante un tablero Kanban y controla el inventario de manera automática. 

Una de las reglas de negocio principales es el **bloqueo sistémico**: una orden de trabajo no puede pasar a "En Producción" si no se ha registrado previamente el ingreso del anticipo obligatorio.

## Arquitectura del Sistema

El proyecto está construido bajo una arquitectura moderna y separada (Frontend / Backend):

- **Frontend:** React con Tailwind CSS para garantizar una interfaz de usuario rápida, limpia y responsiva.
- **Backend:** Python utilizando Django y Django REST Framework (DRF) para crear una API robusta y aprovechar el ORM.
- **Base de Datos:** PostgreSQL para persistir la información relacional y mantener la integridad de los registros financieros, inventario y pedidos.

## Módulos Principales

1. **Módulo de Ventas y Pedidos (Core):**
   - Registro de clientes (Nombre y Teléfono).
   - Registro de pedidos (Producto, Total, Canal de origen).
   - Tablero de control visual (Kanban) con estados: `Pendiente` → `En Producción` → `Listo` → `Entregado` / `Cancelado`.
   
2. **Módulo de Inventario:**
   - Catálogo de productos (Materia Prima y Producto Terminado).
   - Control automatizado de entradas y salidas de stock.
   - Descuento automático de inventario al momento de procesar un pedido.

3. **Módulo de Finanzas Básico:**
   - Registro obligatorio de anticipos para iniciar producción.
   - Cálculo automático de saldos pendientes.
   - Registro de pagos finales al momento de la entrega.

4. **Gestión de Roles y Accesos:**
   - **Administrador:** Control total del sistema.
   - **Recepción:** Encargado de ingresar pedidos, registrar pagos y entregar productos.
   - **Taller:** Encargado de visualizar el tablero de producción y marcar los pedidos como listos.

## Justificación de Valor

La implementación de este MVP transforma a la empresa de un modelo operativo reactivo a uno centralizado y estandarizado. Al eliminar la dependencia absoluta de la memoria y el control manual, se mitiga el riesgo de pérdida de información comercial clave. Financieramente, el sistema blinda la liquidez de la empresa al asegurar que ninguna orden consuma tiempo de diseño o materia prima sin antes haber asegurado el anticipo obligatorio.
