from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
import json
from coffee.models import Venta, Producto, DetalleVenta
from .services import ReporteService

@login_required
def reportes_dashboard(request):
    tipo = request.GET.get('tipo', 'ventas')
    context = {'tipo_reporte': tipo}
    return render(request, 'reportes/reportes.html', context)

@login_required
def reporte_ventas(request):
    """Reporte de ventas"""
    return render(request, 'reportes/ventas.html')

@login_required
def reporte_inventario(request):
    """Reporte de inventario"""
    return render(request, 'reportes/inventario.html')

@login_required
def reporte_ganancias(request):
    """Reporte de ganancias"""
    return render(request, 'reportes/ganancias.html')

@require_POST
def api_estadisticas_ventas(request):
    """API para estadísticas de ventas"""
    datos = ReporteService.get_estadisticas_ventas()
    return JsonResponse(datos)

@require_POST
def api_inventario(request):
    """API para datos de inventario"""
    datos = ReporteService.get_datos_inventario()
    return JsonResponse(datos)

@require_POST
def api_ganancias(request):
    """API para reporte de ganancias"""
    datos = ReporteService.get_ganancias()
    return JsonResponse(datos)

@require_POST
def api_ventas_detalladas(request):
    """API para ventas detalladas con filtros"""
    try:
        data = json.loads(request.body)
        periodo = data.get('periodo', 'mes')
        fechaDesde = data.get('fechaDesde')
        fechaHasta = data.get('fechaHasta')
        
        # Calcular fechas según período
        if fechaDesde and fechaHasta:
            # Usar fechas personalizadas
            desde = datetime.strptime(fechaDesde, '%Y-%m-%d')
            hasta = datetime.strptime(fechaHasta, '%Y-%m-%d')
        elif periodo == 'hoy':
            desde = timezone.now().date()
            hasta = timezone.now().date()
        elif periodo == 'semana':
            desde = timezone.now().date() - timedelta(days=7)
            hasta = timezone.now().date()
        elif periodo == 'año':
            desde = timezone.now().date().replace(month=1, day=1)
            hasta = timezone.now().date()
        else:  # mes por defecto
            desde = timezone.now().date().replace(day=1)
            hasta = timezone.now().date()
        
        # Filtrar ventas
        ventas = Venta.objects.filter(
            fecha__date__gte=desde,
            fecha__date__lte=hasta
        ).select_related('usuario').prefetch_related('detalles').order_by('-fecha')
        
        # Calcular métricas
        total_ventas = ventas.count()
        ingresos_totales = 0
        total_productos = 0
        
        ventas_data = []
        for venta in ventas:
            items = venta.detalles.count()
            total = sum(d.subtotal for d in venta.detalles.all())
            ingresos_totales += total
            total_productos += sum(d.cantidad for d in venta.detalles.all())
            
            ventas_data.append({
                'id': venta.id,
                'fecha': venta.fecha.strftime('%d/%m/%Y %H:%M'),
                'usuario': venta.usuario.username if venta.usuario else 'Sistema',
                'items': items,
                'total': str(total)
            })
        
        promedio_venta = ingresos_totales / total_ventas if total_ventas > 0 else 0
        
        return JsonResponse({
            'ok': True,
            'total_ventas': total_ventas,
            'ingresos_totales': str(ingresos_totales),
            'promedio_venta': str(promedio_venta),
            'total_productos': total_productos,
            'ventas': ventas_data
        })
        
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})