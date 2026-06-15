from decimal import Decimal, InvalidOperation

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import Usuario, Cliente, ItemInventario, Pedido, MovimientoInventario
from .serializers import (
    UsuarioSerializer, ClienteSerializer, ItemInventarioSerializer,
    PedidoSerializer, MovimientoInventarioSerializer
)
from .permissions import IsAdministrator, IsReceptionOrAdmin, IsWorkshopOrAdmin


def descontar_inventario_pedido(pedido):
    motivo_base = f"Uso automático en Pedido #{pedido.id}"

    if MovimientoInventario.objects.filter(motivo=motivo_base).exists():
        return False

    with transaction.atomic():
        for detalle in pedido.detalles.select_related('item').all():
            item = detalle.item

            if item.stock_actual < detalle.cantidad:
                raise ValidationError({"error": f"Stock insuficiente para {item.nombre}. Actual: {item.stock_actual}"})

            item.stock_actual -= detalle.cantidad
            item.save(update_fields=['stock_actual'])

            MovimientoInventario.objects.create(
                item=item,
                tipo_movimiento='Salida',
                cantidad=detalle.cantidad,
                motivo=motivo_base,
            )

    return True

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [IsAuthenticated()]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsReceptionOrAdmin()]
        return [IsAuthenticated()]

class ItemInventarioViewSet(viewsets.ModelViewSet):
    queryset = ItemInventario.objects.all()
    serializer_class = ItemInventarioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [IsAuthenticated()]

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsReceptionOrAdmin()]
        return [IsAuthenticated()]

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsReceptionOrAdmin()]
        if self.action in ['anticipo', 'cierre']:
            return [IsReceptionOrAdmin()]
        if self.action == 'estado':
            return [IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        with transaction.atomic():
            pedido = serializer.save()
            if pedido.anticipo_pagado > 0:
                descontar_inventario_pedido(pedido)

    # Endpoint personalizado: PATCH /api/pedidos/{id}/estado/
    @action(detail=True, methods=['patch'])
    def estado(self, request, pk=None):
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')

        if not nuevo_estado:
            return Response({"error": "Debe proporcionar un estado."}, status=status.HTTP_400_BAD_REQUEST)

        rol_usuario = getattr(request.user, 'rol', None)
        es_admin = request.user.is_superuser or rol_usuario == 'Administrador'

        if nuevo_estado == 'En Producción':
            if not es_admin and rol_usuario != 'Recepcion':
                return Response(
                    {"error": "No tienes permiso para mover pedidos a 'En Producción'."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if pedido.anticipo_pagado <= 0:
                return Response(
                    {"error": "No se puede pasar a 'En Producción' sin registrar el anticipo."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif nuevo_estado == 'Listo':
            if not es_admin and rol_usuario != 'Taller':
                return Response(
                    {"error": "No tienes permiso para marcar pedidos como 'Listo'."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if pedido.estado != 'En Producción':
                return Response(
                    {"error": "Solo se puede marcar como listo un pedido en producción."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif nuevo_estado == 'Cancelado':
            if not es_admin and rol_usuario != 'Recepcion':
                return Response(
                    {"error": "No tienes permiso para cancelar pedidos."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        else:
            return Response(
                {"error": "Cambio de estado no permitido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                if nuevo_estado == 'En Producción':
                    descontar_inventario_pedido(pedido)

                pedido.estado = nuevo_estado
                pedido.save()

        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(self.get_serializer(pedido).data)

    # Endpoint personalizado: PATCH /api/pedidos/{id}/cierre/
    @action(detail=True, methods=['patch'])
    def cierre(self, request, pk=None):
        pedido = self.get_object()
        pago_final = request.data.get('pago_final')

        if pedido.estado != 'Listo':
            return Response(
                {"error": "Solo se puede cerrar un pedido que esté en estado 'Listo'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pago_final is None:
            return Response(
                {"error": "Debe proporcionar el monto del pago final."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pago_final_decimal = Decimal(str(pago_final))
        except (InvalidOperation, ValueError):
            return Response(
                {"error": "Monto de pago final inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pago_final_decimal < 0:
            return Response(
                {"error": "El pago final no puede ser negativo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pago_final_decimal != pedido.saldo_pendiente:
            return Response(
                {"error": f"El pago final debe ser exactamente el saldo pendiente ({pedido.saldo_pendiente})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            pedido.anticipo_pagado += pago_final_decimal
            pedido.estado = 'Entregado'
            pedido.save()

        return Response(self.get_serializer(pedido).data)

    # Endpoint personalizado: PATCH /api/pedidos/{id}/anticipo/
    @action(detail=True, methods=['patch'])
    def anticipo(self, request, pk=None):
        pedido = self.get_object()
        nuevo_anticipo = request.data.get('anticipo_pagado')

        if nuevo_anticipo is None:
            return Response({"error": "Debe proporcionar el monto del anticipo."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pedido.anticipo_pagado = Decimal(str(nuevo_anticipo))

            with transaction.atomic():
                pedido.save()
                if pedido.anticipo_pagado > 0:
                    descontar_inventario_pedido(pedido)

            return Response(self.get_serializer(pedido).data)
        except (InvalidOperation, ValueError):
            return Response({"error": "Monto de anticipo inválido."}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)