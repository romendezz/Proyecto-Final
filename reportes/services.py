from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from coffee.models import Venta, Producto, DetalleVenta

class ReporteService:
    """Servicios para generación de reportes"""
    
    @staticmethod
    def get_estadisticas_ventas():
        """Obtiene estadísticas generales de ventas"""
        try:
            from datetime import timedelta
            
            # Ventas totales
            total_ventas = Venta.objects.count()
            
            # Ingresos totales (usando propiedad subtotal)
            ingresos_totales = sum(d.subtotal for d in DetalleVenta.objects.all())
            
            # Productos con bajo stock
            stock_bajo = Producto.objects.filter(stock__lt=5).count()
            
            # Total de productos
            total_productos = Producto.objects.count()
            
            # Productos top
            productos_top = DetalleVenta.objects.values(
                'producto__nombre'
            ).annotate(
                total=Sum('cantidad')
            ).order_by('-total')[:5]
            
            # Ventas por mes (últimos 6 meses)
            seis_meses_atras = timezone.now() - timedelta(days=180)
            ventas_mes = {}
            for i in range(6):
                mes_actual = timezone.now() - timedelta(days=30*i)
                mes_key = mes_actual.strftime('%m-%Y')
                ventas_mes[mes_key] = Venta.objects.filter(
                    fecha__month=mes_actual.month,
                    fecha__year=mes_actual.year
                ).count()
            
            return {
                'ok': True,
                'total_ventas': total_ventas,
                'ingresos_totales': str(ingresos_totales),
                'stock_bajo': stock_bajo,
                'total_productos': total_productos,
                'productos_top': list(productos_top),
                'ventas_mes': ventas_mes,
            }
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    @staticmethod
    def get_datos_inventario():
        """Obtiene datos de inventario"""
        try:
            productos = Producto.objects.all()
            
            datos = []
            stock_total = 0
            valor_inventario = 0
            productos_agotados = 0
            for p in productos:
                estado = 'Agotado' if p.stock == 0 else ('Bajo' if p.stock < 5 else 'Normal')
                stock_total += p.stock
                valor_producto = float(p.precio) * p.stock
                valor_inventario += valor_producto
                
                if p.stock == 0:
                    productos_agotados += 1
                    
                datos.append({
                    'id': p.id,
                    'nombre': p.nombre,
                    'stock': p.stock,
                    'precio': str(p.precio),
                    'proveedor': p.proveedor.nombre if p.proveedor else '',
                    'estado': estado,
                    'valor': str(valor_producto)
                })
            
            return {
                'ok': True,
                'productos': datos,
                'total_productos': len(productos),
                'stock_total': stock_total,
                'valor_inventario': str(valor_inventario),
                'productos_agotados': productos_agotados
            }
        except Exception as e:
            return {'ok': False, 'error': str(e)}
    
    @staticmethod
    def get_ganancias():
        """Obtiene reporte de ganancias"""
        try:
            from datetime import timedelta
            
            # Ganancias totales (usando propiedad subtotal)
            ganancia_total = sum(d.subtotal for d in DetalleVenta.objects.all())
            
            # Ganancias por producto
            ganancias_producto = []
            productos_con_ventas = DetalleVenta.objects.values('producto__nombre').annotate(
                total_cantidad=Sum('cantidad')
            ).order_by('-total_cantidad')[:10]
            
            for item in productos_con_ventas:
                detalles = DetalleVenta.objects.filter(producto__nombre=item['producto__nombre'])
                total_ganancia = sum(d.subtotal for d in detalles)
                ganancias_producto.append({
                    'producto__nombre': item['producto__nombre'],
                    'total': total_ganancia,
                    'cantidad': item['total_cantidad']
                })
            
            # Ganancias por mes
            seis_meses_atras = timezone.now() - timedelta(days=180)
            ganancias_mensuales = {}
            for i in range(6):
                mes_actual = timezone.now() - timedelta(days=30*i)
                mes_key = mes_actual.strftime('%m-%Y')
                detalles_mes = DetalleVenta.objects.filter(
                    venta__fecha__month=mes_actual.month,
                    venta__fecha__year=mes_actual.year
                )
                ganancias_mensuales[mes_key] = sum(d.subtotal for d in detalles_mes)
            
            # Datos adicionales para las tarjetas
            total_transacciones = Venta.objects.count()
            promedio_venta = float(ganancia_total) / total_transacciones if total_transacciones > 0 else 0
            
            # Producto más rentable
            producto_mas_rentable = ganancias_producto[0] if ganancias_producto else {
                'producto__nombre': 'N/A',
                'total': '0'
            }
            
            return {
                'ok': True,
                'ganancia_total': str(ganancia_total),
                'ganancias_producto': ganancias_producto,
                'ganancias_mensuales': ganancias_mensuales,
                'total_transacciones': total_transacciones,
                'promedio_venta': str(promedio_venta),
                'producto_mas_rentable': {
                    'nombre': producto_mas_rentable['producto__nombre'],
                    'ganancia': producto_mas_rentable['total']
                }
            }
        except Exception as e:
            return {'ok': False, 'error': str(e)}