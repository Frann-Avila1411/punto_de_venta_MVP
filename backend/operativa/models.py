from django.db import models
from django.contrib.auth.models import AbstractUser

# tabla de usuarios personalizada para incluir el rol
class Usuario(AbstractUser):
    ROLES = [
        ('Administrador', 'Administrador'),
        ('Recepcion', 'Recepción'),
        ('Taller', 'Taller'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='Recepcion')

    def __str__(self):
        return f"{self.username} - {self.rol}"

class Cliente(models.Model):
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class ItemInventario(models.Model):
    TIPOS = [
        ('Materia Prima', 'Materia Prima'),
        ('Producto Terminado', 'Producto Terminado'),
    ]
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=30, choices=TIPOS)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

class Pedido(models.Model):
    CANALES = [
        ('WhatsApp', 'WhatsApp'),
        ('Facebook', 'Facebook'),
        ('Tienda', 'Tienda'),
    ]
    ESTADOS = [
        ('Pendiente', 'Pendiente'),
        ('En Producción', 'En Producción'),
        ('Listo', 'Listo'),
        ('Entregado', 'Entregado'),
        ('Cancelado', 'Cancelado'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='pedidos')
    canal_origen = models.CharField(max_length=20, choices=CANALES)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='Pendiente')
    total_acordado = models.DecimalField(max_digits=10, decimal_places=2)
    anticipo_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    saldo_pendiente = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.saldo_pendiente = self.total_acordado - self.anticipo_pagado
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.nombre}"

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    item = models.ForeignKey(ItemInventario, on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} x {self.item.nombre} (Pedido #{self.pedido.id})"

class MovimientoInventario(models.Model):
    TIPOS = [
        ('Entrada', 'Entrada'),
        ('Salida', 'Salida'),
    ]
    item = models.ForeignKey(ItemInventario, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=10, choices=TIPOS)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_movimiento} de {self.cantidad} {self.item.nombre}"