from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Cliente, ItemInventario, Pedido, DetallePedido, MovimientoInventario

@admin.register(Usuario)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Rol', {'fields': ('rol',)}),
    )
    list_display = ['username', 'email', 'rol', 'is_staff']

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'telefono', 'fecha_registro']
    search_fields = ['nombre', 'telefono']

@admin.register(ItemInventario)
class ItemInventarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'tipo', 'stock_actual', 'stock_minimo']
    list_filter = ['tipo']
    search_fields = ['nombre']

class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 1

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['id', 'cliente', 'canal_origen', 'estado', 'total_acordado', 'anticipo_pagado', 'saldo_pendiente', 'fecha_creacion']
    list_filter = ['estado', 'canal_origen']
    search_fields = ['cliente__nombre', 'id']
    inlines = [DetallePedidoInline]
    readonly_fields = ['saldo_pendiente']

@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'item', 'tipo_movimiento', 'cantidad', 'motivo', 'fecha']
    list_filter = ['tipo_movimiento']
    search_fields = ['item__nombre', 'motivo']