from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
    path('', views.reportes_dashboard, name='dashboard'),
    path('ventas/', views.reporte_ventas, name='ventas'),
    path('inventario/', views.reporte_inventario, name='inventario'),
    path('ganancias/', views.reporte_ganancias, name='ganancias'),
    path('api/estadisticas/', views.api_estadisticas_ventas, name='api_estadisticas'),
]