import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from coffee.models import Proveedor, Producto

# Limpiar datos anteriores
Producto.objects.all().delete()
Proveedor.objects.all().delete()

# Crear proveedores
proveedores_data = [
    {'nombre': 'Proveedor Bebidas', 'telefono': '55511178', 'direccion': 'Holguín'},
    {'nombre': 'Proveedor Dulces', 'telefono': '55522209', 'direccion': 'Holguín'},
    {'nombre': 'Proveedor Helados', 'telefono': '58906542', 'direccion': 'Holguin'},
    {'nombre': 'Proveedor Café', 'telefono': '56738907', 'direccion': 'Holguin'},
]

proveedores = []
for p in proveedores_data:
    prov = Proveedor.objects.create(**p)
    proveedores.append(prov)

print(f"✅ {len(proveedores)} proveedores creados")

# Crear productos con asignación correcta de proveedores
# Productos de BEBIDAS
productos_bebidas = [
    ('Menta Plus Negro', 120, 40),
    ('Menta Plus Azul', 100, 40),
    ('Menta Plus Verde', 100, 40),
    ('Menta Plus Rosado', 100, 40),
    ('Jugos', 250, 40),
    ('Refresco en lata', 250, 35),
    ('Cerveza Mayabe', 300, 50),
    ('Cerveza Cristal', 320, 45),
    ('Cerveza Parranda', 280, 45),
    ('Malta', 300, 40),
    ('Néctar', 380, 30),
]

# Productos de DULCES
productos_dulces = [
    ('Botonetas', 50, 60),
    ('Chupas', 50, 60),
    ('Bombones', 50, 50),
    ('Paniqueque', 50, 30),
    ('Pastelito', 50, 30),
    ('Ponquesito', 80, 30),
    ('Turrones', 80, 25),
    ('Pan con salchicha', 150, 30),
    ('Pan con mayonesa', 100, 30),
    ('Rosita de maíz', 100, 40),
    ('Galletas María', 350, 25),
    ('Galletas Milk', 100, 40),
    ('Mantecados', 60, 30),
    ('Polvorones', 50, 30),
    ('Empanadilla', 10, 60),
    ('Nayara', 30, 60),
    ('Pulpita', 20, 60),
    ('Caramelos', 10, 100),
    ('Galletas Kremati', 150, 30),
    ('Merengues', 50, 30),
    ('Galletas Show Gol', 200, 30),
    ('Nutella', 150, 15),
    ('Malvaviscos', 60, 30),
    ('Cremita de leche', 80, 25),
    ('Pasta maní en grano', 150, 20),
    ('Pasta maní molida', 90, 20),
    ('Chicles', 50, 60),
    ('Rosquitas', 10, 80),
    ('Cigarros', 400, 20),
]

# Productos de HELADOS
productos_helados = [
    ('Helado', 100, 20),
]

# Productos de CAFÉ
productos_cafe = [
    ('Yogurt', 230, 25),
    ('Pellys', 180, 30),
    ('Café', 25, 100),
    ('Café Capuchino', 200, 50),
    ('Café Expresso', 100, 50),
]

# Asignar productos a proveedores
categorias = [
    (productos_bebidas, proveedores[0]),
    (productos_dulces, proveedores[1]),
    (productos_helados, proveedores[2]),
    (productos_cafe, proveedores[3]),
]

count = 0
for productos_lista, proveedor in categorias:
    for nombre, precio, stock in productos_lista:
        Producto.objects.create(
            nombre=nombre,
            precio=precio,
            stock=stock,
            proveedor=proveedor
        )
        count += 1

print(f"✅ {count} productos creados y distribuidos entre proveedores")
print("✅ ¡Base de datos lista!")
