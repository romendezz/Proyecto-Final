from django.shortcuts import render, get_object_or_404 , HttpResponse
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from .models import Producto
import json

def index (request):
    return render(request, 'coffee/login.html')

def login(request):
    return render(request, 'coffee/login.html')

def dashboard(request):
    return render(request, 'coffee/dashboard.html')

def products(request):
    return productos(request)

def productos(request):
    qs = Producto.objects.all()

    # Paginación sencilla: 5 por página
    paginador = Paginator(qs, 5)
    page = request.GET.get("page")
    productos = paginador.get_page(page)

    return render(request, "coffee/products.html", {
        "productos": productos
    })


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
                "proveedor": p.proveedor
            })

    return JsonResponse(datos, safe=False)


@csrf_exempt
def crear_producto(request):
    data = json.loads(request.body)
    p = Producto.objects.create(
        nombre=data["nombre"],
        precio=data["precio"],
        stock=data["stock"],
        proveedor=data["proveedor"],
    )
    return JsonResponse({"ok": True})


@csrf_exempt
def editar_producto(request, id):
    p = get_object_or_404(Producto, id=id)
    data = json.loads(request.body)

    p.nombre = data["nombre"]
    p.precio = data["precio"]
    p.stock = data["stock"]
    p.proveedor = data["proveedor"]
    p.save()

    return JsonResponse({"ok": True})


@csrf_exempt
def eliminar_producto(request, id):
    p = get_object_or_404(Producto, id=id)
    p.delete()
    return JsonResponse({"ok": True})


def ventas(request):
    return render(request, 'coffee/ventas.html')

def reportes(request):
    return render(request, 'coffee/reportes.html') 

def proveedores(request):
    return render(request, 'coffee/proveedores.html')