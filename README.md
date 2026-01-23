Descripción del Proyecto

El Sistema Web de Inventario y Ventas para la Cafetería Rojas es una herramienta desarrollada para optimizar la gestión interna de inventarios y el control de ventas dentro de la cafetería. Su propósito principal es mejorar la eficiencia administrativa mediante la automatización de procesos clave como el registro de movimientos de stock, el seguimiento de productos y la generación de reportes diarios. Con esto se busca eliminar los problemas asociados a la gestión manual, que suele generar errores, retrasos y dificultades en la operación diaria.

Público objetivo

El sistema está dirigido exclusivamente al personal interno de la cafetería, dividido en dos roles principales:
 • Administrador:
Cuenta con acceso completo al sistema. Puede gestionar el inventario, registrar y editar productos, generar reportes detallados, gestionar proveedores y supervisar la información general del sistema.
 • Dependientes:
Tienen acceso limitado. Pueden consultar existencias, registrar salidas básicas por ventas internas y recibir alertas de stock bajo, pero no pueden realizar cambios críticos en el inventario ni acceder a módulos administrativos.

Funcionalidades principales

El sistema incorpora un conjunto de herramientas diseñadas para facilitar las operaciones internas:
 • Dashboard principal:
Presenta un resumen visual del estado actual del inventario, alertas de productos críticos y accesos rápidos según el rol del usuario.
 • Gestión de productos:
Permite consultar existencias, registrar entradas y salidas internas de productos (sin manejar pagos ni cobros, ya que el sistema no funciona como punto de venta externo).
 • Reportes de inventario:
Genera informes detallados sobre movimientos, consumo por períodos, rotación de productos y tendencias, lo que facilita la toma de decisiones y la planificación de compras.
 • Control de proveedores:
Incluye el registro de proveedores principales, el historial de entregas y el seguimiento de pedidos pendientes.
 • Sistema de roles:
Asegura que cada usuario tenga acceso únicamente a las funciones correspondientes a su nivel. El administrador puede ver y modificar toda la información, mientras que los dependientes solo consultan y registran operaciones básicas.

Proceso de ventas

Las ventas se realizan de manera presencial en el mostrador de la cafetería. Aunque el sistema no procesa pagos electrónicos ni funciona como un punto de venta tradicional, registra automáticamente las salidas de inventario asociadas a cada venta, manteniendo un control actualizado en tiempo real mediante la arquitectura MVT de Django. Esto garantiza que la cafetería tenga siempre claridad sobre las existencias disponibles, los productos próximos a agotarse y las necesidades de reabastecimiento, contribuyendo a una operación más eficiente y sin complicaciones financieras externas.
