from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from .models import Cliente, ItemInventario, Pedido, MovimientoInventario, Usuario


class PedidoInventarioTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.usuario = Usuario.objects.create_user(
			username='operador',
			password='Clave12345',
			email='operador@example.com',
			rol='Recepcion',
		)
		self.usuario_taller = Usuario.objects.create_user(
			username='taller',
			password='Clave12345',
			email='taller@example.com',
			rol='Taller',
		)
		self.token = Token.objects.create(user=self.usuario)
		self.token_taller = Token.objects.create(user=self.usuario_taller)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
		self.cliente = Cliente.objects.create(nombre='Cliente Prueba', telefono='555-1234')

	def _crear_item(self, nombre, stock):
		return ItemInventario.objects.create(
			nombre=nombre,
			tipo='Producto Terminado',
			stock_actual=Decimal(str(stock)),
			stock_minimo=Decimal('0.00'),
		)

	def _crear_pedido(self, detalles, anticipo='0.00'):
		payload = {
			'cliente': self.cliente.id,
			'canal_origen': 'Tienda',
			'estado': 'Pendiente',
			'total_acordado': '100.00',
			'anticipo_pagado': anticipo,
			'detalles': detalles,
		}
		return self.client.post('/api/pedidos/', payload, format='json')

	def test_crear_pedido_con_anticipo_descuenta_inventario_y_no_duplica_al_cambiar_estado(self):
		item = self._crear_item('Producto A', '10.00')

		response = self._crear_pedido(
			detalles=[{'item': item.id, 'cantidad': '2.00', 'precio_unitario': '50.00'}],
			anticipo='20.00',
		)

		self.assertEqual(response.status_code, 201)
		item.refresh_from_db()
		self.assertEqual(item.stock_actual, Decimal('8.00'))

		pedido = Pedido.objects.get()
		self.assertEqual(MovimientoInventario.objects.count(), 1)

		estado_response = self.client.patch(
			f'/api/pedidos/{pedido.id}/estado/',
			{'estado': 'En Producción'},
			format='json',
		)

		self.assertEqual(estado_response.status_code, 200)
		item.refresh_from_db()
		self.assertEqual(item.stock_actual, Decimal('8.00'))
		self.assertEqual(MovimientoInventario.objects.count(), 1)

	def test_anticipo_posterior_descuenta_inventario(self):
		item = self._crear_item('Producto B', '7.00')

		response = self._crear_pedido(
			detalles=[{'item': item.id, 'cantidad': '3.00', 'precio_unitario': '50.00'}],
			anticipo='0.00',
		)

		self.assertEqual(response.status_code, 201)
		pedido = Pedido.objects.get()

		anticipo_response = self.client.patch(
			f'/api/pedidos/{pedido.id}/anticipo/',
			{'anticipo_pagado': '15.00'},
			format='json',
		)

		self.assertEqual(anticipo_response.status_code, 200)
		item.refresh_from_db()
		self.assertEqual(item.stock_actual, Decimal('4.00'))
		self.assertEqual(MovimientoInventario.objects.count(), 1)

	def test_crear_pedido_con_stock_insuficiente_revierte_todo(self):
		item_disponible = self._crear_item('Producto C', '5.00')
		item_insuficiente = self._crear_item('Producto D', '1.00')

		response = self._crear_pedido(
			detalles=[
				{'item': item_disponible.id, 'cantidad': '2.00', 'precio_unitario': '50.00'},
				{'item': item_insuficiente.id, 'cantidad': '3.00', 'precio_unitario': '50.00'},
			],
			anticipo='10.00',
		)

		self.assertEqual(response.status_code, 400)
		item_disponible.refresh_from_db()
		item_insuficiente.refresh_from_db()
		self.assertEqual(item_disponible.stock_actual, Decimal('5.00'))
		self.assertEqual(item_insuficiente.stock_actual, Decimal('1.00'))
		self.assertEqual(Pedido.objects.count(), 0)
		self.assertEqual(MovimientoInventario.objects.count(), 0)

	def test_cierre_con_pago_final_entrega_y_cierra_saldo(self):
		item = self._crear_item('Producto E', '10.00')

		response = self._crear_pedido(
			detalles=[{'item': item.id, 'cantidad': '2.00', 'precio_unitario': '50.00'}],
			anticipo='20.00',
		)

		self.assertEqual(response.status_code, 201)
		pedido = Pedido.objects.get()

		self.client.patch(
			f'/api/pedidos/{pedido.id}/estado/',
			{'estado': 'En Producción'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_taller.key}')
		self.client.patch(
			f'/api/pedidos/{pedido.id}/estado/',
			{'estado': 'Listo'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

		cierre_response = self.client.patch(
			f'/api/pedidos/{pedido.id}/cierre/',
			{'pago_final': '80.00'},
			format='json',
		)

		self.assertEqual(cierre_response.status_code, 200)
		pedido.refresh_from_db()
		self.assertEqual(pedido.estado, 'Entregado')
		self.assertEqual(pedido.anticipo_pagado, Decimal('100.00'))
		self.assertEqual(pedido.saldo_pendiente, Decimal('0.00'))

	def test_taller_no_puede_crear_pedidos(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_taller.key}')
		item = self._crear_item('Producto F', '10.00')

		response = self._crear_pedido(
			detalles=[{'item': item.id, 'cantidad': '1.00', 'precio_unitario': '10.00'}],
			anticipo='0.00',
		)

		self.assertEqual(response.status_code, 403)


class AuthTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.usuario = Usuario.objects.create_user(
			username='recepcion',
			password='Clave12345',
			email='recepcion@example.com',
			rol='Recepcion',
		)

	def test_login_devuelve_token_y_usuario(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'recepcion', 'password': 'Clave12345'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('token', response.data)
		self.assertEqual(response.data['user']['username'], 'recepcion')
		self.assertEqual(response.data['user']['rol'], 'Recepcion')

	def test_endpoint_protegido_rechaza_sin_login(self):
		response = self.client.get('/api/clientes/')
		self.assertEqual(response.status_code, 401)
