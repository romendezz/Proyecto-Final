from django.shortcuts import render, get_object_or_404 , HttpResponse, redirect
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from datetime import datetime
from .models import Producto, Proveedor, Venta, DetalleVenta
from django.utils import timezone
import json
from decimal import Decimal
import re

def index (request):
    return render(request, 'coffee/login.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('inicio')
        else:
            return render(request, 'coffee/login.html', {
                'error': 'Usuario o contraseña incorrectos'
            })
    
    return render(request, 'coffee/login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
def inicio(request):
    productos = Producto.objects.all()
    proveedores = Proveedor.objects.all()
    total_productos = productos.count()
    total_proveedores = proveedores.count()
    
    # Calcular stock total
    from django.db.models import Sum
    stock_total = productos.aggregate(Sum('stock'))['stock__sum'] or 0
    
    # Contar productos agotados
    productos_agotados = productos.filter(stock=0).count()
    
    context = {
        'productos': productos,
        'proveedores': proveedores,
        'total_productos': total_productos,
        'total_proveedores': total_proveedores,
        'stock_total': stock_total,
        'productos_agotados': productos_agotados,
    }
    return render(request, 'coffee/inicio.html', context)

@login_required
def productos(request):
    ver = request.GET.get('ver', 'todos')
    
    if ver == 'bajo-stock':
        productos_list = Producto.objects.select_related('proveedor').filter(stock__lt=5, stock__gt=0).order_by('stock')
    else:
        productos_list = Producto.objects.select_related('proveedor').all()
    
    proveedores = Proveedor.objects.all()
    context = {
        'productos': productos_list,
        'proveedores': proveedores,
        'vista_actual': ver,
    }
    return render(request, "coffee/productos.html", context)


def buscar_productos(request):
    # Búsqueda que ignora acentos y mayúsculas (útil con SQLite)
    import unicodedata

    texto = request.GET.get("q", "") or ""
    def normalize(s):
        if s is None:
            return ""
        return unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode('ascii').lower()

    q_norm = normalize(texto)

    datos = []
    for p in Producto.objects.all():
        if q_norm in normalize(p.nombre):
            datos.append({
                "id": p.id,
                "nombre": p.nombre,
                "precio": str(p.precio),
                "stock": p.stock,
                "proveedor": p.proveedor.nombre if p.proveedor else "",
                "proveedor_id": p.proveedor.id if p.proveedor else ""
            })

    return JsonResponse(datos, safe=False)


@require_POST
def crear_producto(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            # Validaciones
            nombre = data.get("nombre", "").strip()
            if not nombre or len(nombre) < 3:
                return JsonResponse({"ok": False, "error": "El nombre debe tener al menos 3 caracteres"})
            
            try:
                precio = Decimal(str(data.get("precio", 0)))
                if precio < 0:
                    return JsonResponse({"ok": False, "error": "El precio no puede ser negativo"})
            except:
                return JsonResponse({"ok": False, "error": "Precio inválido"})
            
            try:
                stock = int(data.get("stock", 0))
                if stock < 0:
                    return JsonResponse({"ok": False, "error": "El stock no puede ser negativo"})
            except:
                return JsonResponse({"ok": False, "error": "Stock inválido"})
            
            # Verificar si el producto ya existe
            if Producto.objects.filter(nombre__iexact=nombre).exists():
                return JsonResponse({"ok": False, "error": "El producto ya existe"})
            
            proveedor = Proveedor.objects.get(id=data.get("proveedor_id")) if data.get("proveedor_id") else Proveedor.objects.first()
            
            producto = Producto.objects.create(
                nombre=nombre,
                precio=precio,
                stock=stock,
                proveedor=proveedor
            )
            return JsonResponse({"ok": True, "id": producto.id})
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    return JsonResponse({"ok": False})


@require_POST
def editar_producto(request, id):
    if request.method == 'POST':
        p = get_object_or_404(Producto, id=id)
        data = json.loads(request.body)
        
        try:
            # Validaciones
            nombre = data.get("nombre", p.nombre).strip()
            if nombre != p.nombre and not nombre:
                return JsonResponse({"ok": False, "error": "El nombre no puede estar vacío"})
            if len(nombre) < 3:
                return JsonResponse({"ok": False, "error": "El nombre debe tener al menos 3 caracteres"})
            
            try:
                precio = Decimal(str(data.get("precio", p.precio)))
                if precio < 0:
                    return JsonResponse({"ok": False, "error": "El precio no puede ser negativo"})
            except:
                return JsonResponse({"ok": False, "error": "Precio inválido"})
            
            try:
                stock = int(data.get("stock", p.stock))
                if stock < 0:
                    return JsonResponse({"ok": False, "error": "El stock no puede ser negativo"})
            except:
                return JsonResponse({"ok": False, "error": "Stock inválido"})
            
            p.nombre = nombre
            p.precio = precio
            p.stock = stock
            
            if data.get("proveedor_id"):
                proveedor = Proveedor.objects.get(id=data.get("proveedor_id"))
                p.proveedor = proveedor
            
            p.save()
            return JsonResponse({"ok": True})
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    return JsonResponse({"ok": False})


@require_POST
def eliminar_producto(request, id):
    p = get_object_or_404(Producto, id=id)
    p.delete()
    return JsonResponse({"ok": True})


@login_required
def ventas(request):
    """Vista principal de ventas con acceso directo a historial diario o mensual"""
    filtro = request.GET.get('filtro', '')
    
    context = {
        'productos': Producto.objects.all(),
        'filtro_activo': filtro  # 'hoy', 'mes', o None
    }
    
    return render(request, 'coffee/ventas.html', context)


@require_POST
def crear_venta(request):
    """Crear una nueva venta con detalles"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            productos_venta = data.get('productos', [])
            
            if not productos_venta:
                return JsonResponse({"ok": False, "error": "No hay productos en la venta"})
            
            # Validar que cada producto tenga datos válidos
            for item in productos_venta:
                if not item.get('producto_id'):
                    return JsonResponse({"ok": False, "error": "Producto ID inválido"})
                
                try:
                    cantidad = int(item.get('cantidad', 0))
                    if cantidad <= 0:
                        return JsonResponse({"ok": False, "error": "La cantidad debe ser mayor a 0"})
                except:
                    return JsonResponse({"ok": False, "error": "Cantidad inválida"})
                
                try:
                    precio = Decimal(str(item.get('precio', 0)))
                    if precio < 0:
                        return JsonResponse({"ok": False, "error": "El precio no puede ser negativo"})
                except:
                    return JsonResponse({"ok": False, "error": "Precio inválido"})
            
            # Crear venta
            venta = Venta.objects.create(
                usuario=request.user if request.user.is_authenticated else None
            )
            
            total = Decimal('0')
            
            # Crear detalles de venta
            for item in productos_venta:
                producto = get_object_or_404(Producto, id=item['producto_id'])
                cantidad = int(item['cantidad'])
                precio_unitario = Decimal(str(item['precio']))
                
                # Verificar stock
                if producto.stock < cantidad:
                    venta.delete()
                    return JsonResponse({"ok": False, "error": f"Stock insuficiente de {producto.nombre}"})
                
                # Restar stock
                producto.stock -= cantidad
                producto.save()
                
                # Crear detalle
                subtotal = precio_unitario * cantidad
                DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                
                total += subtotal
            
            return JsonResponse({
                "ok": True,
                "venta_id": venta.id,
                "total": str(total),
                "fecha": venta.fecha.strftime('%d/%m/%Y %H:%M')
            })
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    
    return JsonResponse({"ok": False})


def listar_ventas_json(request):
    """Retorna todas las ventas en JSON con filtros opcionales de día, mes y año"""
    ventas_list = Venta.objects.all().order_by('-fecha')
    
    # Aplicar filtros
    dia = request.GET.get('dia')
    mes = request.GET.get('mes')
    año = request.GET.get('año')
    
    if dia:
        # Formato esperado: YYYY-MM-DD
        try:
            fecha_obj = datetime.strptime(dia, '%Y-%m-%d').date()
            ventas_list = ventas_list.filter(fecha__date=fecha_obj)
        except ValueError:
            pass
    
    if mes:
        ventas_list = ventas_list.filter(fecha__month=mes)
    if año:
        ventas_list = ventas_list.filter(fecha__year=año)
    
    datos = []
    
    for venta in ventas_list:
        detalles = venta.detalles.all()
        total = sum(d.subtotal for d in detalles)
        
        datos.append({
            'id': venta.id,
            'fecha': venta.fecha.strftime('%d/%m/%Y %H:%M'),
            'cantidad_items': detalles.count(),
            'total': str(total),
            'usuario': venta.usuario.username if venta.usuario else 'Sistema'
        })
    
    return JsonResponse(datos, safe=False)


def editar_venta(request, id):
    """Editar una venta existente"""
    if request.method == 'PUT':
        try:
            venta = get_object_or_404(Venta, id=id)
            data = json.loads(request.body)
            nuevos_detalles = data.get('detalles', [])
            
            if not nuevos_detalles:
                return JsonResponse({"ok": False, "error": "La venta debe tener al menos un producto"})
            
            # Obtener detalles originales para devolver stock
            detalles_originales = venta.detalles.all()
            
            # Devolver stock original
            for detalle_original in detalles_originales:
                producto = detalle_original.producto
                producto.stock += detalle_original.cantidad
                producto.save()
            
            # Eliminar detalles originales
            detalles_originales.delete()
            
            # Crear nuevos detalles y actualizar stock
            for detalle_data in nuevos_detalles:
                producto = get_object_or_404(Producto, id=detalle_data.get('producto_id'))
                cantidad = detalle_data.get('cantidad')
                precio_unitario = detalle_data.get('precio_unitario')
                
                # Verificar stock disponible
                if producto.stock < cantidad:
                    return JsonResponse({
                        "ok": False, 
                        "error": f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}, Solicitado: {cantidad}"
                    })
                
                # Crear nuevo detalle
                DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario
                )
                
                # Actualizar stock
                producto.stock -= cantidad
                producto.save()
            
            return JsonResponse({"ok": True})
            
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    
    return JsonResponse({"ok": False, "error": "Método no permitido"})


def eliminar_venta(request, id):
    """Eliminar una venta y sus detalles"""
    if request.method == 'DELETE':
        try:
            venta = get_object_or_404(Venta, id=id)
            
            # Obtener detalles para devolver stock
            detalles = venta.detalles.all()
            
            # Devolver stock a los productos
            for detalle in detalles:
                producto = detalle.producto
                producto.stock += detalle.cantidad
                producto.save()
            
            # Eliminar la venta (esto eliminará en cascada los detalles)
            venta.delete()
            
            return JsonResponse({"ok": True})
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    
    return JsonResponse({"ok": False, "error": "Método no permitido"})


def obtener_venta(request, id):
    """Obtiene detalles de una venta específica"""
    venta = get_object_or_404(Venta, id=id)
    detalles = venta.detalles.all()
    
    datos = {
        'id': venta.id,
        'fecha': venta.fecha.strftime('%d/%m/%Y %H:%M'),
        'usuario': venta.usuario.username if venta.usuario else 'Sistema',
        'detalles': []
    }
    
    total = 0
    for detalle in detalles:
        subtotal = detalle.subtotal
        total += subtotal
        
        datos['detalles'].append({
            'producto': detalle.producto.nombre,
            'producto_id': detalle.producto.id,
            'cantidad': detalle.cantidad,
            'precio_unitario': str(detalle.precio_unitario),
            'subtotal': str(subtotal)
        })
    
    datos['total'] = str(total)
    
    return JsonResponse(datos)
@login_required
def reportes(request):
    tipo = request.GET.get('tipo', 'ventas')
    context = {
        'tipo_reporte': tipo,
    }
    return render(request, 'coffee/reportes.html', context)


@require_POST
def estadisticas_ventas(request):
    """Obtiene estadísticas de ventas"""
    from django.db.models import Sum, Count, Q
    from datetime import timedelta
    
    try:
        # Ventas totales
        total_ventas = Venta.objects.count()
        
        # Ingresos totales
        ingresos_totales = 0
        for venta in Venta.objects.all():
            ingresos_totales += sum(d.subtotal for d in venta.detalles.all())
        
        # Ventas por mes (últimos 6 meses)
        meses_es = {
            'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
            'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
            'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
            'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
        }
        
        ventas_mes = {}
        for i in range(6):
            mes_actual = timezone.now() - timedelta(days=30*i)
            mes_en = mes_actual.strftime('%B')
            mes_es = meses_es.get(mes_en, mes_en)
            mes_key = f"{mes_es} {mes_actual.year}"
            cantidad = Venta.objects.filter(
                fecha__month=mes_actual.month,
                fecha__year=mes_actual.year
            ).count()
            ventas_mes[mes_key] = cantidad
        
        # Productos más vendidos
        productos_vendidos = {}
        for venta in Venta.objects.all():
            for detalle in venta.detalles.all():
                if detalle.producto.nombre in productos_vendidos:
                    productos_vendidos[detalle.producto.nombre] += detalle.cantidad
                else:
                    productos_vendidos[detalle.producto.nombre] = detalle.cantidad
        
        productos_top = sorted(
            productos_vendidos.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Stock bajo
        stock_bajo = Producto.objects.filter(stock__lt=5).count()
        
        return JsonResponse({
            'ok': True,
            'total_ventas': total_ventas,
            'ingresos_totales': str(Decimal(ingresos_totales)),
            'stock_bajo': stock_bajo,
            'ventas_mes': ventas_mes,
            'productos_top': [{'nombre': p[0], 'cantidad': p[1]} for p in productos_top],
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


@require_POST
def reporte_inventario(request):
    """Obtiene estadísticas de inventario"""
    try:
        productos = Producto.objects.all()
        
        # Resumen de inventario
        total_productos = productos.count()
        stock_total = sum(p.stock for p in productos)
        valor_inventario = sum(float(p.precio) * p.stock for p in productos)
        productos_agotados = productos.filter(stock=0).count()
        
        # Productos por estado
        productos_data = []
        for p in productos:
            estado = 'Agotado'
            if p.stock > 10:
                estado = 'Normal'
            elif p.stock > 0:
                estado = 'Bajo'
            
            productos_data.append({
                'id': p.id,
                'nombre': p.nombre,
                'stock': p.stock,
                'precio': str(p.precio),
                'proveedor': p.proveedor.nombre if p.proveedor else 'N/A',
                'estado': estado,
                'valor': str(float(p.precio) * p.stock)
            })
        
        return JsonResponse({
            'ok': True,
            'total_productos': total_productos,
            'stock_total': stock_total,
            'valor_inventario': str(Decimal(valor_inventario)),
            'productos_agotados': productos_agotados,
            'productos': productos_data,
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


@require_POST
def reporte_ganancias(request):
    """Obtiene reporte de ganancias"""
    try:
        from django.db.models import Sum
        from datetime import timedelta
        
        # Ganancias totales
        ganancia_total = Decimal('0')
        for venta in Venta.objects.all():
            ganancia_total += sum(d.subtotal for d in venta.detalles.all())
        
        # Ganancias por mes (últimos 6 meses)
        meses_es = {
            'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
            'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
            'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
            'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
        }
        
        ganancias_mes = {}
        for i in range(6):
            mes_actual = timezone.now() - timedelta(days=30*i)
            mes_en = mes_actual.strftime('%B')
            mes_es = meses_es.get(mes_en, mes_en)
            mes_key = f"{mes_es} {mes_actual.year}"
            ganancia_mes = Decimal('0')
            ventas_mes = Venta.objects.filter(
                fecha__month=mes_actual.month,
                fecha__year=mes_actual.year
            )
            for venta in ventas_mes:
                ganancia_mes += sum(d.subtotal for d in venta.detalles.all())
            ganancias_mes[mes_key] = str(ganancia_mes)
        
        # Producto más rentable
        ganancia_por_producto = {}
        for venta in Venta.objects.all():
            for detalle in venta.detalles.all():
                nombre = detalle.producto.nombre
                if nombre in ganancia_por_producto:
                    ganancia_por_producto[nombre] += float(detalle.subtotal)
                else:
                    ganancia_por_producto[nombre] = float(detalle.subtotal)
        
        producto_mas_rentable = max(ganancia_por_producto.items(), key=lambda x: x[1]) if ganancia_por_producto else ('N/A', 0)
        
        # Promedio de ventas
        total_ventas = Venta.objects.count()
        promedio_venta = ganancia_total / total_ventas if total_ventas > 0 else Decimal('0')
        
        return JsonResponse({
            'ok': True,
            'ganancia_total': str(ganancia_total),
            'promedio_venta': str(promedio_venta),
            'total_transacciones': total_ventas,
            'ganancias_mes': ganancias_mes,
            'producto_mas_rentable': {
                'nombre': producto_mas_rentable[0],
                'ganancia': str(Decimal(str(producto_mas_rentable[1])))
            }
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


@login_required
def proveedores(request):
    proveedores_list = Proveedor.objects.all()
    context = {
        'proveedores': proveedores_list,
    }
    return render(request, 'coffee/proveedores.html', context)


@require_POST
def crear_proveedor(request):
    """Crear un nuevo proveedor"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validaciones
            nombre = data.get("nombre", "").strip()
            if not nombre or len(nombre) < 3:
                return JsonResponse({"ok": False, "error": "El nombre debe tener al menos 3 caracteres"})
            
            contacto = data.get("contacto", "").strip()
            if not contacto:
                return JsonResponse({"ok": False, "error": "El contacto es requerido"})
            
            email = data.get("email", "").strip()
            if email:
                email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
                if not re.match(email_regex, email):
                    return JsonResponse({"ok": False, "error": "Email inválido"})
            
            # Verificar no hay duplicado
            if Proveedor.objects.filter(nombre__iexact=nombre).exists():
                return JsonResponse({"ok": False, "error": "El proveedor ya existe"})
            
            proveedor = Proveedor.objects.create(
                nombre=nombre,
                telefono=contacto,
                correo=email,
            )
            
            return JsonResponse({
                "ok": True,
                "id": proveedor.id,
                "mensaje": "Proveedor creado exitosamente"
            })
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    
    return JsonResponse({"ok": False})


@require_POST
def editar_proveedor(request, id):
    """Editar un proveedor existente"""
    if request.method == 'POST':
        try:
            proveedor = get_object_or_404(Proveedor, id=id)
            data = json.loads(request.body)
            
            # Validaciones
            nombre = data.get("nombre", proveedor.nombre).strip()
            if not nombre or len(nombre) < 3:
                return JsonResponse({"ok": False, "error": "El nombre debe tener al menos 3 caracteres"})
            
            contacto = data.get("contacto", proveedor.telefono).strip()
            if not contacto:
                return JsonResponse({"ok": False, "error": "El contacto es requerido"})
            
            email = data.get("email", proveedor.correo).strip()
            if email:
                email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
                if not re.match(email_regex, email):
                    return JsonResponse({"ok": False, "error": "Email inválido"})
            
            proveedor.nombre = nombre
            proveedor.telefono = contacto
            proveedor.correo = email
            proveedor.email = email
            proveedor.save()
            
            return JsonResponse({"ok": True, "mensaje": "Proveedor actualizado exitosamente"})
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})
    
    return JsonResponse({"ok": False})


@require_POST
def eliminar_proveedor(request, id):
    """Eliminar un proveedor"""
    try:
        proveedor = get_object_or_404(Proveedor, id=id)
        
        # Verificar si tiene productos asociados
        if proveedor.productos.exists():
            return JsonResponse({
                "ok": False,
                "error": "No se puede eliminar, tiene productos asociados"
            })
        
        proveedor.delete()
        return JsonResponse({"ok": True, "mensaje": "Proveedor eliminado"})
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)})


@require_POST
def listar_proveedores_json(request):
    """Retorna todos los proveedores en JSON"""
    proveedores_list = Proveedor.objects.all()
    datos = []
    
    for prov in proveedores_list:
        cantidad_productos = prov.producto_set.count()
        datos.append({
            'id': prov.id,
            'nombre': prov.nombre,
            'contacto': prov.telefono,
            'email': prov.correo,
            'productos': cantidad_productos,
        })
    
    return JsonResponse(datos, safe=False)


def datos_dashboard(request):
    """Retorna datos para el dashboard/inicio"""
    from django.db.models import Sum, Count
    from datetime import datetime, timedelta
    
    productos = Producto.objects.all()
    ventas = Venta.objects.all()
    
    # Datos básicos
    total_productos = productos.count()
    total_proveedores = Proveedor.objects.count()
    stock_total = productos.aggregate(Sum('stock'))['stock__sum'] or 0
    productos_agotados = productos.filter(stock=0).count()
    
    # Ventas últimos 6 meses
    hoy = datetime.now()
    ventas_ultimos_6_meses = []
    meses_nombres = []
    
    for i in range(5, -1, -1):
        fecha = hoy - timedelta(days=30*i)
        mes_inicio = fecha.replace(day=1)
        if i == 0:
            mes_fin = hoy
        else:
            mes_fin = (fecha.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        cantidad_ventas = ventas.filter(
            fecha__gte=mes_inicio,
            fecha__lte=mes_fin
        ).count()
        ventas_ultimos_6_meses.append(cantidad_ventas)
        meses_nombres.append(fecha.strftime('%b'))
    
    # Inventario por categoría (basado en proveedores)
    inventario_por_proveedor = []
    labels_inventario = []
    for prov in Proveedor.objects.all():
        stock_prov = prov.producto_set.aggregate(Sum('stock'))['stock__sum'] or 0
        inventario_por_proveedor.append(stock_prov)
        labels_inventario.append(prov.nombre)
    
    datos = {
        'total_productos': total_productos,
        'total_proveedores': total_proveedores,
        'stock_total': stock_total,
        'productos_agotados': productos_agotados,
        'ventas_ultimos_6_meses': ventas_ultimos_6_meses,
        'meses': meses_nombres,
        'inventario_por_proveedor': inventario_por_proveedor,
        'labels_inventario': labels_inventario,
    }
    
    return JsonResponse(datos)

@login_required
def configuracion_page(request):
    #if not request.user.rol == "Admin":
    #   return redirect("inicio")
    return render(request, "coffee/configuracion.html")

# -------------------- USUARIOS --------------------
@require_POST
def config_usuarios(request):
    try:
        usuarios = Usuario.objects.all().values("id", "nombre", "correo", "rol", "is_active")
        lista = list(usuarios)
        return JsonResponse(lista, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@require_POST
def crear_usuario(request):
    if request.method == "POST":
        datos = json.loads(request.body)
        u = Usuario.objects.create(
            username=datos["correo"],
            nombre=datos["nombre"],
            email=datos["correo"],
            rol=datos["rol"]
        )
        Auditoria.objects.create(usuario=request.user.username, accion=f"Creó usuario {u.nombre}")
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False})

@require_POST
def editar_usuario(request, id):
    if request.method == "POST":
        u = get_object_or_404(Usuario, id=id)
        datos = json.loads(request.body)
        u.nombre = datos["nombre"]
        u.email = datos["correo"]
        u.rol = datos["rol"]
        u.save()
        Auditoria.objects.create(usuario=request.user.username, accion=f"Editó usuario {u.nombre}")
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False})

@require_POST
def eliminar_usuario(request, id):
    if request.method == "POST":
        u = get_object_or_404(Usuario, id=id)
        nombre = u.nombre
        u.delete()
        Auditoria.objects.create(usuario=request.user.username, accion=f"Eliminó usuario {nombre}")
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False})

# -------------------- ROLES --------------------
@require_POST
def config_roles(request):
    roles = Usuario.objects.values("rol").distinct()
    lista = []
    for r in roles:
        lista.append({"rol": r["rol"]})
    return JsonResponse(lista, safe=False)

# -------------------- AUDITORÍA --------------------
@require_POST
def config_auditoria(request):
    logs = Auditoria.objects.all().order_by("-fecha").values("usuario", "accion", "fecha")
    return JsonResponse(list(logs), safe=False)

# -------------------- SESIONES --------------------
@require_POST
def config_sesiones(request):
    sesiones = SesionActiva.objects.all().values("id", "usuario", "ip", "ultima_vez")
    return JsonResponse(list(sesiones), safe=False)