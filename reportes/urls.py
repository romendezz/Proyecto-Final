from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
    path('', views.reportes_dashboard, name='dashboard'),
    path('ventas/', views.reporte_ventas, name='ventas'),
    path('inventario/', views.reporte_inventario, name='inventario'),
    path('ganancias/', views.reporte_ganancias, name='ganancias'),
    path('api/estadisticas/', views.api_estadisticas_ventas, name='api_estadisticas'),
    path('api/inventario/', views.api_inventario, name='api_inventario'),
    path('api/ganancias/', views.api_ganancias, name='api_ganancias'),
    path('api/ventas-detalladas/', views.api_ventas_detalladas, name='api_ventas_detalladas'),
]
