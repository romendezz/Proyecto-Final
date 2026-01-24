# Vistas tradicionales con redirección y mensajes para CRUD
# Estas vistas complementan las vistas AJAX existentes

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Producto, Proveedor, Venta, DetalleVenta
import json
from decimal import Decimal

@login_required
def crear_producto_tradicional(request):
    """Vista tradicional para crear producto con redirección y mensajes"""
    if request.method == 'POST':
        try:
            # Validaciones similares a la versión AJAX
            nombre = request.POST.get('nombre', '').strip()
            if not nombre or len(nombre) < 3:
                messages.error(request, 'El nombre debe tener al menos 3 caracteres')
                return redirect('productos')
            
            precio = Decimal(request.POST.get('precio', '0'))
            if precio < 0:
                messages.error(request, 'El precio no puede ser negativo')
                return redirect('productos')
            
            stock = int(request.POST.get('stock', '0'))
            if stock < 0:
                messages.error(request, 'El stock no puede ser negativo')
                return redirect('productos')
            
            proveedor_id = request.POST.get('proveedor_id')
            if not proveedor_id:
                messages.error(request, 'Debe seleccionar un proveedor')
                return redirect('productos')
            
            # Crear producto
            producto = Producto.objects.create(
                nombre=nombre,
                precio=precio,
                stock=stock,
                proveedor_id=proveedor_id
            )
            
            messages.success(request, f'¡Producto "{producto.nombre}" creado exitosamente!')
            return redirect('productos')
            
        except Exception as e:
            messages.error(request, f'Error al crear producto: {str(e)}')
            return redirect('productos')
    
    return redirect('productos')

@login_required
def editar_producto_tradicional(request, id):
    """Vista tradicional para editar producto con redirección y mensajes"""
    producto = get_object_or_404(Producto, id=id)
    
    if request.method == 'POST':
        try:
            nombre = request.POST.get('nombre', '').strip()
            if not nombre or len(nombre) < 3:
                messages.error(request, 'El nombre debe tener al menos 3 caracteres')
                return redirect('productos')
            
            precio = Decimal(request.POST.get('precio', '0'))
            if precio < 0:
                messages.error(request, 'El precio no puede ser negativo')
                return redirect('productos')
            
            stock = int(request.POST.get('stock', '0'))
            if stock < 0:
                messages.error(request, 'El stock no puede ser negativo')
                return redirect('productos')
            
            proveedor_id = request.POST.get('proveedor_id')
            if not proveedor_id:
                messages.error(request, 'Debe seleccionar un proveedor')
                return redirect('productos')
            
            # Actualizar producto
            producto.nombre = nombre
            producto.precio = precio
            producto.stock = stock
            producto.proveedor_id = proveedor_id
            producto.save()
            
            messages.success(request, f'¡Producto "{producto.nombre}" actualizado exitosamente!')
            return redirect('productos')
            
        except Exception as e:
            messages.error(request, f'Error al actualizar producto: {str(e)}')
            return redirect('productos')
    
    return redirect('productos')

@login_required
def eliminar_producto_tradicional(request, id):
    """Vista tradicional para eliminar producto con redirección y mensajes"""
    producto = get_object_or_404(Producto, id=id)
    nombre_producto = producto.nombre
    
    try:
        # Verificar si el producto está en ventas
        if DetalleVenta.objects.filter(producto=producto).exists():
            messages.error(request, f'No se puede eliminar "{nombre_producto}" porque está registrado en ventas')
            return redirect('productos')
        
        producto.delete()
        messages.success(request, f'¡Producto "{nombre_producto}" eliminado exitosamente!')
        
    except Exception as e:
        messages.error(request, f'Error al eliminar producto: {str(e)}')
    
    return redirect('productos')

@login_required
def crear_proveedor_tradicional(request):
    """Vista tradicional para crear proveedor con redirección y mensajes"""
    if request.method == 'POST':
        try:
            nombre = request.POST.get('nombre', '').strip()
            if not nombre or len(nombre) < 3:
                messages.error(request, 'El nombre debe tener al menos 3 caracteres')
                return redirect('proveedores')
            
            telefono = request.POST.get('telefono', '').strip()
            if not telefono:
                messages.error(request, 'El teléfono es requerido')
                return redirect('proveedores')
            
            direccion = request.POST.get('direccion', '').strip()
            
            # Verificar si ya existe
            if Proveedor.objects.filter(nombre__iexact=nombre).exists():
                messages.error(request, f'Ya existe un proveedor con el nombre "{nombre}"')
                return redirect('proveedores')
            
            # Crear proveedor
            proveedor = Proveedor.objects.create(
                nombre=nombre,
                telefono=telefono,
                direccion=direccion
            )
            
            messages.success(request, f'¡Proveedor "{proveedor.nombre}" creado exitosamente!')
            return redirect('proveedores')
            
        except Exception as e:
            messages.error(request, f'Error al crear proveedor: {str(e)}')
            return redirect('proveedores')
    
    return redirect('proveedores')

@login_required
def editar_proveedor_tradicional(request, id):
    """Vista tradicional para editar proveedor con redirección y mensajes"""
    proveedor = get_object_or_404(Proveedor, id=id)
    
    if request.method == 'POST':
        try:
            nombre = request.POST.get('nombre', '').strip()
            if not nombre or len(nombre) < 3:
                messages.error(request, 'El nombre debe tener al menos 3 caracteres')
                return redirect('proveedores')
            
            telefono = request.POST.get('telefono', '').strip()
            if not telefono:
                messages.error(request, 'El teléfono es requerido')
                return redirect('proveedores')
            
            direccion = request.POST.get('direccion', '').strip()
            
            # Actualizar proveedor
            proveedor.nombre = nombre
            proveedor.telefono = telefono
            proveedor.direccion = direccion
            proveedor.save()
            
            messages.success(request, f'¡Proveedor "{proveedor.nombre}" actualizado exitosamente!')
            return redirect('proveedores')
            
        except Exception as e:
            messages.error(request, f'Error al actualizar proveedor: {str(e)}')
            return redirect('proveedores')
    
    return redirect('proveedores')

@login_required
def eliminar_proveedor_tradicional(request, id):
    """Vista tradicional para eliminar proveedor con redirección y mensajes"""
    proveedor = get_object_or_404(Proveedor, id=id)
    nombre_proveedor = proveedor.nombre
    
    try:
        # Verificar si tiene productos asociados
        if proveedor.producto_set.exists():
            messages.error(request, f'No se puede eliminar "{nombre_proveedor}" porque tiene productos asociados')
            return redirect('proveedores')
        
        proveedor.delete()
        messages.success(request, f'¡Proveedor "{nombre_proveedor}" eliminado exitosamente!')
        
    except Exception as e:
        messages.error(request, f'Error al eliminar proveedor: {str(e)}')
    
    return redirect('proveedores')
