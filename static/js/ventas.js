// Control de Ventas

let productosVenta = []; // Carrito de productos
let filtroActual = ''; // Guardar filtro actual

document.addEventListener('DOMContentLoaded', function () {
  // Detectar filtro en URL
  const urlParams = new URLSearchParams(window.location.search);
  filtroActual = urlParams.get('filtro') || '';
  
  // Si hay filtro, mostrar directamente el historial
  if (filtroActual) {
    setTimeout(() => {
      document.getElementById('seccionRegistro').style.display = 'none';
      document.getElementById('seccionHistorial').style.display = 'block';
      
      // Actualizar título
      const titulo = document.querySelector('h2');
      if (filtroActual === 'hoy') {
        titulo.innerHTML = '<i class="bi bi-calendar-day"></i> Ventas de Hoy';
      } else if (filtroActual === 'mes') {
        titulo.innerHTML = '<i class="bi bi-calendar-month"></i> Ventas de Este Mes';
      }
      
      cargarVentas();
    }, 100);
  }
  
  const btnBuscar = document.getElementById('btnBuscar');
  const buscarProducto = document.getElementById('buscarProducto');
  const btnConfirmar = document.getElementById('btnConfirmar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnVerHistorial = document.getElementById('btnVerHistorial');
  const btnVolverRegistro = document.getElementById('btnVolverRegistro');

  // Buscar producto
  btnBuscar.addEventListener('click', agregarProducto);
  buscarProducto.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarProducto();
  });

  // Confirmar venta
  btnConfirmar.addEventListener('click', confirmarVenta);

  // Limpiar carrito
  btnLimpiar.addEventListener('click', limpiarCarrito);

  // Ver historial
  btnVerHistorial.addEventListener('click', mostrarHistorial);
  btnVolverRegistro.addEventListener('click', volverRegistro);
});

function agregarProducto() {
  const nombreProducto = document.getElementById('buscarProducto').value.trim();

  if (!nombreProducto) {
    mostrarToast('Por favor ingrese un producto', 'warning');
    return;
  }

  // Buscar producto en la lista
  fetch(`/productos/buscar/?q=${encodeURIComponent(nombreProducto)}`)
    .then((res) => res.json())
    .then((datos) => {
      if (datos.length === 0) {
        mostrarToast('Producto no encontrado', 'danger');
        return;
      }

      const producto = datos[0];

      // Verificar stock
      if (producto.stock <= 0) {
        mostrarToast(`${producto.nombre} no tiene stock disponible`, 'warning');
        return;
      }

      // Verificar si ya existe en el carrito
      const existe = productosVenta.find((p) => p.id === producto.id);
      if (existe) {
        existe.cantidad++;
        existe.subtotal = (existe.cantidad * existe.precio).toFixed(2);
      } else {
        productosVenta.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio),
          cantidad: 1,
          subtotal: parseFloat(producto.precio),
          stock: producto.stock,
        });
      }

      renderizarTabla();
      document.getElementById('buscarProducto').value = '';
      mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error al buscar producto', 'danger');
    });
}

function renderizarTabla() {
  const tbody = document.getElementById('tablaProductosVenta');
  const filaVacia = document.getElementById('filaVacia');

  if (productosVenta.length === 0) {
    tbody.innerHTML =
      '<tr id="filaVacia" class="text-center text-muted"><td colspan="5">Ningún producto agregado</td></tr>';
    document.getElementById('totalVenta').textContent = '$0.00';
    return;
  }

  let html = '';
  let total = 0;

  productosVenta.forEach((p, index) => {
    const subtotal = (p.cantidad * p.precio).toFixed(2);
    total += parseFloat(subtotal);

    html += `
      <tr>
        <td><strong>${p.nombre}</strong></td>
        <td>$${p.precio.toFixed(2)}</td>
        <td>
          <input
            type="number"
            class="form-control form-control-sm"
            value="${p.cantidad}"
            min="1"
            max="${p.stock}"
            onchange="actualizarCantidad(${index}, this.value)"
          />
        </td>
        <td>$${subtotal}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  document.getElementById('totalVenta').textContent = '$' + total.toFixed(2);
}

function actualizarCantidad(index, cantidad) {
  cantidad = parseInt(cantidad);

  if (cantidad <= 0) {
    eliminarProducto(index);
    return;
  }

  if (cantidad > productosVenta[index].stock) {
    mostrarToast(
      `Stock máximo disponible: ${productosVenta[index].stock}`,
      'warning'
    );
    renderizarTabla();
    return;
  }

  productosVenta[index].cantidad = cantidad;
  renderizarTabla();
}

function eliminarProducto(index) {
  const nombre = productosVenta[index].nombre;
  productosVenta.splice(index, 1);
  renderizarTabla();
  mostrarToast(`${nombre} eliminado del carrito`, 'info');
}

function limpiarCarrito() {
  if (productosVenta.length === 0) {
    mostrarToast('El carrito está vacío', 'info');
    return;
  }

  if (confirm('¿Está seguro de limpiar el carrito?')) {
    productosVenta = [];
    renderizarTabla();
    mostrarToast('Carrito limpiado', 'success');
  }
}

function confirmarVenta() {
  if (productosVenta.length === 0) {
    mostrarToast('Agregue productos antes de confirmar', 'warning');
    return;
  }

  // Validar que las cantidades sean válidas
  let todasValidadas = true;
  for (let p of productosVenta) {
    if (p.cantidad <= 0) {
      mostrarToast(`Cantidad inválida para ${p.nombre}`, 'danger');
      todasValidadas = false;
      break;
    }
    if (p.cantidad > p.stock) {
      mostrarToast(`Stock insuficiente para ${p.nombre}. Stock disponible: ${p.stock}`, 'danger');
      todasValidadas = false;
      break;
    }
  }

  if (!todasValidadas) return;

  if (!confirm('¿Confirmar venta? Esta acción no se puede deshacer.')) {
    return;
  }

  const datos = {
    productos: productosVenta.map((p) => ({
      producto_id: p.id,
      cantidad: p.cantidad,
      precio: p.precio,
    })),
  };

  fetch('/ventas/crear/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')
        ?.value,
    },
    body: JSON.stringify(datos),
  })
    .then((res) => res.json())
    .then((datos) => {
      if (datos.ok) {
        mostrarToast(`Venta registrada exitosamente (ID: ${datos.venta_id})`, 'success');
        productosVenta = [];
        renderizarTabla();
      } else {
        mostrarToast(datos.error || 'Error al registrar venta', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
    });
}

function mostrarHistorial() {
  document.getElementById('seccionRegistro').style.display = 'none';
  document.getElementById('seccionHistorial').style.display = 'block';

  cargarVentas();
}

function volverRegistro() {
  document.getElementById('seccionHistorial').style.display = 'none';
  document.getElementById('seccionRegistro').style.display = 'block';
}

function cargarVentas() {
  fetch('/ventas/listar/')
    .then((res) => res.json())
    .then((datos) => {
      const cuerpoTabla = document.getElementById('cuerpoTablaVentas');
      if (!cuerpoTabla) return;

      if (datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr class="text-center"><td colspan="6">No hay ventas registradas</td></tr>';
        return;
      }

      let html = '';
      datos.forEach((venta, index) => {
        html += `
          <tr>
            <td>${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>${venta.usuario}</td>
            <td>${venta.cantidad_items}</td>
            <td><strong>$${parseFloat(venta.total).toFixed(2)}</strong></td>
            <td>
              <button class="btn btn-info btn-sm" onclick="verDetalleVenta(${venta.id})">
                <i class="bi bi-eye"></i> Ver
              </button>
            </td>
          </tr>
        `;
      });

      cuerpoTabla.innerHTML = html;
    });
}

function verDetalleVenta(ventaId) {
  fetch(`/ventas/detalle/${ventaId}/`)
    .then((res) => res.json())
    .then((datos) => {
      let detalles = datos.detalles
        .map(
          (d) =>
            `<tr>
          <td>${d.producto}</td>
          <td>${d.cantidad}</td>
          <td>$${parseFloat(d.precio_unitario).toFixed(2)}</td>
          <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
        </tr>`
        )
        .join('');

      const modal = `
        <div class="modal fade" id="modalDetalle" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Detalle Venta #${datos.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p><strong>Fecha:</strong> ${datos.fecha}</p>
                <p><strong>Usuario:</strong> ${datos.usuario}</p>
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${detalles}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;

      // Eliminar modal anterior si existe
      const modalAnterior = document.getElementById('modalDetalle');
      if (modalAnterior) {
        modalAnterior.remove();
      }

      // Agregar nuevo modal y mostrarlo
      document.body.insertAdjacentHTML('beforeend', modal);
      const modalInstance = new bootstrap.Modal(document.getElementById('modalDetalle'));
      modalInstance.show();

      // Limpiar modal cuando se cierra
      document.getElementById('modalDetalle').addEventListener('hidden.bs.modal', function () {
        this.remove();
      });
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error al cargar detalles', 'danger');
    });
}

function mostrarToast(mensaje, tipo = 'info') {
  const toast = document.querySelector('.toast');
  if (!toast) return;

  toast.className = `toast show align-items-center text-white bg-${tipo}`;
  toast.querySelector('.toast-body').textContent = mensaje;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
