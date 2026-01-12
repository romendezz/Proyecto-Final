from . import views
from django.urls import path

urlpatterns = [
    path('', views.login, name='login'),
    path('login/', views.login, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('products/', views.products, name='products'),
    path('ventas/', views.ventas, name='ventas'),
    path('reportes/', views.reportes, name='reportes'),
    path('proveedores/', views.proveedores, name='proveedores'),
    
    # AJAX
    path('productos/buscar/', views.buscar_productos, name='buscar_productos'),
    path('productos/crear/', views.crear_producto, name='crear_producto'),
    path('productos/editar/<int:id>/', views.editar_producto, name='editar_producto'),
    path('productos/eliminar/<int:id>/', views.eliminar_producto, name='eliminar_producto'),
   ]
     
