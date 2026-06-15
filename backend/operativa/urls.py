from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, ClienteViewSet, ItemInventarioViewSet, 
    PedidoViewSet, MovimientoInventarioViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'inventario', ItemInventarioViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('operativa.auth_urls')),
]