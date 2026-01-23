from . import views
from django.urls import path, include

urlpatterns = [
    path('', views.login_view, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('inicio/', views.inicio, name='inicio'),
    path('inicio/datos/', views.datos_dashboard, name='datos_dashboard'),
    path('productos/', views.productos, name='productos'),
    path('productos/buscar/', views.buscar_productos, name='buscar_productos'),
    path('productos/crear/', views.crear_producto, name='crear_producto'),
    path('productos/editar/<int:id>/', views.editar_producto, name='editar_producto'),
    path('productos/eliminar/<int:id>/', views.eliminar_producto, name='eliminar_producto'),
    path('ventas/', views.ventas, name='ventas'),
    path('ventas/crear/', views.crear_venta, name='crear_venta'),
    path('ventas/listar/', views.listar_ventas_json, name='listar_ventas'),
    path('ventas/detalle/<int:id>/', views.obtener_venta, name='detalle_venta'),
    path('ventas/editar/<int:id>/', views.editar_venta, name='editar_venta'),
    path('ventas/eliminar/<int:id>/', views.eliminar_venta, name='eliminar_venta'),
    path('proveedores/', views.proveedores, name='proveedores'),
    path('proveedores/listar/', views.listar_proveedores_json, name='listar_proveedores'),
    path('proveedores/crear/', views.crear_proveedor, name='crear_proveedor'),
    path('proveedores/editar/<int:id>/', views.editar_proveedor, name='editar_proveedor'),
    path('proveedores/eliminar/<int:id>/', views.eliminar_proveedor, name='eliminar_proveedor'),
    
    # Reportes ahora en su propia app
    path('reportes/', include('reportes.urls')),
    
    # Configuración
    path("config/", views.configuracion_page, name="configuracion"),

    # Secciones dinámicas
    path("config/usuarios/", views.config_usuarios, name="config_usuarios"),
    path("config/usuarios/crear/", views.crear_usuario, name="crear_usuario"),
    path("config/usuarios/editar/<int:id>/", views.editar_usuario, name="editar_usuario"),
    path("config/usuarios/eliminar/<int:id>/", views.eliminar_usuario, name="eliminar_usuario"),

    path("config/roles/", views.config_roles, name="config_roles"),
    path("config/auditoria/", views.config_auditoria, name="config_auditoria"),
    path("config/sesiones/", views.config_sesiones, name="config_sesiones"),
]