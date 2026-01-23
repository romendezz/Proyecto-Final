from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Proveedor, Producto, Venta, DetalleVenta, Auditoria, SesionActiva

# Register Usuario with UserAdmin for full user management capabilities
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'rol', 'is_staff', 'is_superuser')
    list_filter = ('rol', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('telefono', 'direccion', 'rol')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('telefono', 'direccion', 'rol')}),
    )

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'correo', 'telefono')
    search_fields = ('nombre', 'correo')
    list_filter = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'proveedor', 'precio')
    list_filter = ('proveedor',)
    search_fields = ('nombre',)

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha', 'usuario')
    list_filter = ('fecha', 'usuario')
    search_fields = ('usuario__username',)
    readonly_fields = ('fecha',)

@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ('venta', 'producto', 'cantidad', 'precio_unitario')
    list_filter = ('venta', 'producto')
    search_fields = ('producto__nombre',)

@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'accion', 'fecha')
    list_filter = ('fecha', 'usuario')
    search_fields = ('usuario', 'accion')
    readonly_fields = ('fecha',)

@admin.register(SesionActiva)
class SesionActivaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ip', 'ultima_vez')
    list_filter = ('usuario', 'ultima_vez')
    search_fields = ('usuario',)
