# Copilot / AI Agent instructions for Proyecto-Final

Resumen rápido
- Proyecto: aplicación web Django (MVT) para inventario y ventas de una cafetería.
- Carpeta principal de la app: `coffee/` (modelos en `coffee/models.py`, vistas en `coffee/views.py`, plantillas en `coffee/templates/coffee/`).

Arquitectura y flujo importante
- Django MVT clásico: URL routing en `config/urls.py` y `coffee/urls.py` → `views` → `models` → plantillas en `coffee/templates/coffee`.
- Activos estáticos en `static/` (JS en `static/js`, CSS en `static/css`, imágenes en `static/images`). Las plantillas suelen extender `coffee/base.html`.
- Base de datos local: `db.sqlite3` en la raíz del proyecto. Migrations en `coffee/migrations/`.

Comandos y flujos de desarrollo (dev)
- Preparar entorno: crea un virtualenv, luego:
  pip install -r requirements.txt
- Migraciones y DB local:
  python manage.py makemigrations
  python manage.py migrate
- Ejecutar servidor de desarrollo:
  python manage.py runserver
- Tests (app coffee):
  python manage.py test coffee
- Acceso al shell de Django:
  python manage.py shell

Convenciones del proyecto (observables)
- Nombres y textos en español: las plantillas y modelos usan nombres en español (ej.: roles, proveedores, productos).
- Plantillas por app en `coffee/templates/coffee/`. Para añadir una página nueva: crear view en `coffee/views.py`, añadir ruta en `coffee/urls.py`, y plantilla que extienda `base.html`.
- Fragmentos/ventanas modales: hay archivos como `modales_productos.html` que se incluyen en otras plantillas; revisa `productos.html` y `ventas.html` para ejemplos.
- Las migraciones muestran cambios de auditoría y roles (ver `coffee/migrations/0002*`, `0003*`). Si ajustas modelos, genera migraciones y aplícalas.

Puntos de integración y dependencias
- No se detectan servicios externos en el repositorio (no hay claves ni clientes configurados). Si necesitas integrar pagos u otros servicios, añade configuraciones en `config/settings.py` y variables de entorno.
- `requirements.txt` controla dependencias; revisar antes de añadir nuevas librerías.

Dónde mirar primero (archivos clave)
- `manage.py` — comandos Django.
- `config/settings.py` — configuración del proyecto (bases de datos, apps instaladas, rutas estáticas/templates).
- `config/urls.py` y `coffee/urls.py` — punto de entrada de rutas.
- `coffee/models.py`, `coffee/views.py`, `coffee/templates/coffee/base.html` — para entender el dominio y la UI.
- `coffee/static/` y `coffee/templates/coffee/*` — recursos front-end y componentes reutilizables.

Ejemplos concretos para cambios comunes
- Añadir una página: editar `coffee/views.py` (nueva función/CBV) → registrar en `coffee/urls.py` → crear `coffee/templates/coffee/nueva.html` que haga `{% extends 'coffee/base.html' %}` y use bloques existentes.
- Añadir un campo al modelo: actualizar `coffee/models.py` → `python manage.py makemigrations coffee` → `python manage.py migrate` → revisar `coffee/admin.py` si debe exponerse en admin.

Notas finales y buenas prácticas observables
- Mantén las plantillas dentro de `coffee/templates/coffee/` para evitar conflictos de nombres.
- Para cambios de CSS/JS modifica los archivos bajo `static/` y recarga el servidor; `collectstatic` no es necesario en desarrollo.
- Evita modificar `db.sqlite3` directamente; usa migraciones.

Si algo de lo anterior está incompleto o quieres que incluya ejemplos de código (views, templates, o comandos PowerShell/Windows), dime qué sección expandir.
