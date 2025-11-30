"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from coffee.views import login, dashboard, products, ventas, reportes, proveedores
from coffee import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', login, name='login'),
    path('dashboard/', dashboard, name='dashboard'),
    path('products/', products, name='products'),
    path('ventas/', ventas, name='ventas'),
    path('reportes/', reportes, name='reportes'),
    path('proveedores/', proveedores, name='proveedores'),

    # AJAX
    path('productos/buscar/', views.buscar_productos, name='buscar_productos'),
    path('productos/crear/', views.crear_producto, name='crear_producto'),
    path('productos/editar/<int:id>/', views.editar_producto, name='editar_producto'),
    path('productos/eliminar/<int:id>/', views.eliminar_producto, name='eliminar_producto'),
]




