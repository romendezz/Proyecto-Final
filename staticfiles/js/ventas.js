// Control de Ventas

let productosVenta = []; // Carrito de productos
let filtroActual = ''; // Guardar filtro actual

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', function () {
  // Detectar filtro en URL
  const urlParams = new URLSearchParams(window.location.search);
  const filtroActual = urlParams.get('filtro') || '';
  
  // Si hay filtro, mostrar directamente el historial
  if (filtroActual === 'hoy' || filtroActual === 'mes') {
    setTimeout(() => {
      document.getElementById('seccionRegistro').style.display = 'none';
      document.getElementById('seccionHistorial').style.display = 'block';
      
      // Establecer filtros por defecto para el mes
      establecerFiltrosPorDefecto();
      
      // Mostrar sección y cargar datos según el filtro
      if (filtroActual === 'hoy') {
        mostrarVentasHoy();
      } else if (filtroActual === 'mes') {
        mostrarVentasMes();
      }
    }, 100);
  }
  
  const btnBuscar = document.getElementById('btnBuscar');
  const buscarProducto = document.getElementById('buscarProducto');
  const btnConfirmar = document.getElementById('btnConfirmar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnVolverRegistro = document.getElementById('btnVolverRegistro');
  const btnFiltrarMes = document.getElementById('btnFiltrarMes');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

  // Buscar producto
  btnBuscar.addEventListener('click', agregarProducto);
  buscarProducto.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarProducto();
  });

  // Confirmar venta
  btnConfirmar.addEventListener('click', confirmarVenta);

  // Limpiar carrito
  btnLimpiar.addEventListener('click', limpiarCarrito);

  // Volver a registro
  btnVolverRegistro.addEventListener('click', volverRegistro);
  
  // Filtros separados
  btnFiltrarMes.addEventListener('click', aplicarFiltroMes);
  btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
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
  console.log('=== CONFIRMAR VENTA ===');
  console.log('Productos en venta:', productosVenta);
  
  if (productosVenta.length === 0) {
    console.log('Error: No hay productos');
    mostrarToast('Agregue productos antes de confirmar', 'warning');
    return;
  }

  // Validar que las cantidades sean válidas
  let todasValidadas = true;
  for (let p of productosVenta) {
    console.log(`Validando producto: ${p.nombre}, cantidad: ${p.cantidad}, stock: ${p.stock}`);
    
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
    console.log('Usuario canceló la venta');
    return;
  }

  const datos = {
    productos: productosVenta.map((p) => ({
      producto_id: p.id,
      cantidad: p.cantidad,
      precio: p.precio,
    })),
  };

  console.log('Datos a enviar:', datos);
  console.log('URL: /ventas/crear/');

  fetch('/ventas/crear/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  })
    .then((res) => {
      console.log('Respuesta status:', res.status);
      return res.json();
    })
    .then((datos) => {
      console.log('Respuesta del servidor:', datos);
      if (datos.ok) {
        mostrarToast(`Venta registrada exitosamente (ID: ${datos.venta_id})`, 'success');
        productosVenta = [];
        renderizarTabla();
        
        // Actualizar historial si está visible
        if (document.getElementById('seccionHistorial').style.display !== 'none') {
          cargarVentas();
        }
      } else {
        console.log('Error en respuesta:', datos);
        mostrarToast(datos.error || 'Error al registrar venta', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
    });
}

function volverRegistro() {
  document.getElementById('seccionHistorial').style.display = 'none';
  document.getElementById('seccionRegistro').style.display = 'block';
}

function mostrarVentasHoy() {
  // Ocultar sección de mes y mostrar sección de hoy
  document.getElementById('seccionVentasMes').style.display = 'none';
  document.getElementById('seccionVentasHoy').style.display = 'block';
  
  // Actualizar título
  document.getElementById('tituloHistorial').innerHTML = '<i class="bi bi-calendar-day"></i> Ventas de Hoy';
  
  // Cargar ventas de hoy
  cargarVentasHoy();
}

function mostrarVentasMes() {
  // Ocultar sección de hoy y mostrar sección de mes
  document.getElementById('seccionVentasHoy').style.display = 'none';
  document.getElementById('seccionVentasMes').style.display = 'block';
  
  // Actualizar título
  document.getElementById('tituloHistorial').innerHTML = '<i class="bi bi-calendar-month"></i> Ventas del Mes';
  
  // Cargar ventas del mes
  cargarVentasPorMes();
}

function cargarVentasHoy() {
  const hoy = new Date();
  const fechaHoy = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
  
  let url = '/ventas/listar/';
  const params = new URLSearchParams();
  params.append('dia', fechaHoy);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((datos) => {
      const cuerpoTabla = document.getElementById('cuerpoTablaVentasHoy');
      if (!cuerpoTabla) return;

      if (datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr class="text-center"><td colspan="6">No hay ventas registradas hoy</td></tr>';
        return;
      }

      let html = '';
      datos.forEach((venta, index) => {
        html += `
          <tr>
            <td>${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>${venta.usuario || 'N/A'}</td>
            <td>${venta.cantidad_items}</td>
            <td><strong>$${parseFloat(venta.total).toFixed(2)}</strong></td>
            <td>
              <button class="btn btn-info btn-sm" onclick="verDetalleVenta(${venta.id})">
                <i class="bi bi-eye"></i> Ver
              </button>
              <button class="btn btn-warning btn-sm" onclick="editarVenta(${venta.id})">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn btn-danger btn-sm" onclick="eliminarVenta(${venta.id})">
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </td>
          </tr>
        `;
      });
      cuerpoTabla.innerHTML = html;
    })
    .catch((err) => {
      console.error('Error al cargar ventas de hoy:', err);
      const cuerpoTabla = document.getElementById('cuerpoTablaVentasHoy');
      if (cuerpoTabla) {
        cuerpoTabla.innerHTML = '<tr class="text-center"><td colspan="6">Error al cargar ventas de hoy</td></tr>';
      }
    });
}

function establecerFiltrosPorDefecto() {
  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
  const añoActual = ahora.getFullYear();
  
  document.getElementById('filtroMes').value = mesActual;
  document.getElementById('filtroAño').value = añoActual;
}

function aplicarFiltroMes() {
  cargarVentasPorMes();
  mostrarToast('Filtro por mes aplicado', 'success');
}

function limpiarFiltros() {
  establecerFiltrosPorDefecto();
  cargarVentasPorMes();
  mostrarToast('Filtros restablecidos al mes actual', 'info');
}

function cargarVentasPorMes() {
  const mes = document.getElementById('filtroMes').value;
  const año = document.getElementById('filtroAño').value;
  
  let url = '/ventas/listar/';
  const params = new URLSearchParams();
  
  if (mes) params.append('mes', mes);
  if (año) params.append('año', año);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((datos) => {
      const cuerpoTabla = document.getElementById('cuerpoTablaVentasMes');
      if (!cuerpoTabla) return;

      if (datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr class="text-center"><td colspan="6">No hay ventas registradas para este mes</td></tr>';
        return;
      }

      let html = '';
      datos.forEach((venta, index) => {
        html += `
          <tr>
            <td>${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>${venta.usuario || 'N/A'}</td>
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
    })
    .catch((err) => {
      console.error('Error al cargar ventas del mes:', err);
      const cuerpoTabla = document.getElementById('cuerpoTablaVentasMes');
      if (cuerpoTabla) {
        cuerpoTabla.innerHTML = '<tr class="text-center"><td colspan="6">Error al cargar ventas del mes</td></tr>';
      }
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

      const modalHTML = `
        <div class="modal fade" id="detalleVentaModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Detalles de Venta #${datos.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p><strong>Fecha:</strong> ${datos.fecha}</p>
                <p><strong>Usuario:</strong> ${datos.usuario}</p>
                <hr>
                <table class="table">
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
                <hr>
                <h5>Total: $${datos.total}</h5>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>`;

      // Eliminar modal anterior si existe
      const modalAnterior = document.getElementById('detalleVentaModal');
      if (modalAnterior) modalAnterior.remove();

      // Agregar nuevo modal
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = new bootstrap.Modal(document.getElementById('detalleVentaModal'));
      modal.show();
    })
    .catch((err) => {
      console.error('Error al cargar detalles:', err);
      mostrarToast('Error al cargar detalles de la venta', 'danger');
    });
}

function editarVenta(ventaId) {
  // Cargar detalles de la venta para editar
  fetch(`/ventas/detalle/${ventaId}/`)
    .then(res => res.json())
    .then(datos => {
      let detallesHTML = datos.detalles.map((d, index) => `
        <tr id="detalle-${index}">
          <td>
            <input type="text" class="form-control" value="${d.producto}" readonly>
            <input type="hidden" class="producto-id" value="${d.producto_id}">
          </td>
          <td>
            <input type="number" class="form-control cantidad" value="${d.cantidad}" min="1" 
                   onchange="calcularSubtotal(${index})" data-precio="${d.precio_unitario}">
          </td>
          <td>
            <input type="text" class="form-control" value="$${parseFloat(d.precio_unitario).toFixed(2)}" readonly>
          </td>
          <td>
            <input type="text" class="form-control subtotal" value="$${parseFloat(d.subtotal).toFixed(2)}" readonly>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarDetalle(${index})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');

      const modalHTML = `
        <div class="modal fade" id="editarVentaModal" tabindex="-1">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Editar Venta #${datos.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <p><strong>Fecha:</strong> ${datos.fecha}</p>
                    <p><strong>Usuario:</strong> ${datos.usuario}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Total:</strong> $<span id="totalEditar">${datos.total}</span></p>
                  </div>
                </div>
                <hr>
                <h6>Productos de la Venta</h6>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="detallesEditar">
                      ${detallesHTML}
                    </tbody>
                  </table>
                </div>
                <div class="row mt-3">
                  <div class="col-md-8 position-relative">
                    <div class="input-group">
                      <input type="text" class="form-control" id="nuevoProductoEditar" 
                             placeholder="Buscar producto para agregar..." 
                             autocomplete="off">
                      <button class="btn btn-outline-secondary" type="button" onclick="buscarProductoParaEditar()">
                        <i class="bi bi-search"></i> Buscar
                      </button>
                    </div>
                    <!-- Dropdown para autocomplete -->
                    <div class="position-absolute w-100" style="z-index: 1050; top: 100%;">
                      <ul id="sugerenciasProductosEditar" class="list-group shadow-sm" style="display: none; max-height: 200px; overflow-y: auto;">
                      </ul>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <button class="btn btn-success w-100" onclick="agregarProductoParaEditar()">
                      <i class="bi bi-plus-circle"></i> Agregar Producto
                    </button>
                  </div>
                </div>
                <div class="text-end mt-3">
                  <button class="btn btn-success" onclick="guardarCambiosVenta(${ventaId})">
                    <i class="bi bi-check-circle"></i> Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      // Eliminar modal anterior si existe
      const modalAnterior = document.getElementById('editarVentaModal');
      if (modalAnterior) modalAnterior.remove();

      // Agregar nuevo modal
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = new bootstrap.Modal(document.getElementById('editarVentaModal'));
      modal.show();
      
      // Agregar event listener para Enter en el campo de búsqueda
      document.getElementById('nuevoProductoEditar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          buscarProductoParaEditar();
        }
      });
      
      // Agregar event listener para autocomplete mientras escribe
      let timeoutAutocomplete;
      document.getElementById('nuevoProductoEditar').addEventListener('input', function(e) {
        clearTimeout(timeoutAutocomplete);
        timeoutAutocomplete = setTimeout(() => {
          buscarProductoParaEditarAutocomplete();
        }, 300);
      });
      
      // Cerrar sugerencias al hacer clic fuera
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#nuevoProductoEditar') && 
            !e.target.closest('#sugerenciasProductosEditar')) {
          ocultarSugerenciasEditar();
        }
      });
    })
    .catch(err => {
      console.error('Error al cargar venta para editar:', err);
      mostrarToast('Error al cargar venta para editar', 'danger');
    });
}

function calcularSubtotal(index) {
  const cantidadInput = document.querySelector(`#detalle-${index} .cantidad`);
  const cantidad = parseInt(cantidadInput.value) || 0;
  const precio = parseFloat(cantidadInput.dataset.precio);
  const subtotal = cantidad * precio;
  
  document.querySelector(`#detalle-${index} .subtotal`).value = `$${subtotal.toFixed(2)}`;
  actualizarTotal();
}

function eliminarDetalle(index) {
  const fila = document.getElementById(`detalle-${index}`);
  if (fila) {
    fila.remove();
    actualizarTotal();
  }
}

function actualizarTotal() {
  const subtotales = document.querySelectorAll('.subtotal');
  let total = 0;
  
  subtotales.forEach(input => {
    const valor = input.value.replace('$', '');
    total += parseFloat(valor) || 0;
  });
  
  document.getElementById('totalEditar').textContent = total.toFixed(2);
}

let productoSeleccionadoParaEditar = null;

function buscarProductoParaEditar() {
  const nombreProducto = document.getElementById('nuevoProductoEditar').value.trim();
  
  if (!nombreProducto) {
    mostrarToast('Por favor ingrese un producto', 'warning');
    return;
  }

  fetch(`/productos/buscar/?q=${encodeURIComponent(nombreProducto)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        mostrarSugerenciasEditar(data);
      } else {
        ocultarSugerenciasEditar();
        mostrarToast('Producto no encontrado', 'warning');
        productoSeleccionadoParaEditar = null;
      }
    })
    .catch(err => {
      console.error('Error al buscar producto:', err);
      mostrarToast('Error al buscar producto', 'danger');
    });
}

function mostrarSugerenciasEditar(productos) {
  const sugerenciasUl = document.getElementById('sugerenciasProductosEditar');
  
  if (productos.length === 0) {
    ocultarSugerenciasEditar();
    return;
  }
  
  let html = '';
  productos.forEach(producto => {
    html += `
      <li class="list-group-item list-group-item-action sugerencia-item" 
          data-producto-id="${producto.id}" 
          data-producto-nombre="${producto.nombre}"
          data-producto-precio="${producto.precio}"
          style="cursor: pointer;">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${producto.nombre}</strong>
            <br>
            <small class="text-muted">Stock: ${producto.stock} | Precio: $${parseFloat(producto.precio).toFixed(2)}</small>
          </div>
          <i class="bi bi-plus-circle text-success"></i>
        </div>
      </li>
    `;
  });
  
  sugerenciasUl.innerHTML = html;
  sugerenciasUl.style.display = 'block';
  
  // Agregar event listeners a las sugerencias
  document.querySelectorAll('.sugerencia-item').forEach(item => {
    item.addEventListener('click', function() {
      seleccionarProductoEditar(this);
    });
  });
}

function ocultarSugerenciasEditar() {
  document.getElementById('sugerenciasProductosEditar').style.display = 'none';
}

function seleccionarProductoEditar(elemento) {
  const productoId = elemento.dataset.productoId;
  const productoNombre = elemento.dataset.productoNombre;
  const productoPrecio = elemento.dataset.productoPrecio;
  
  productoSeleccionadoParaEditar = {
    id: parseInt(productoId),
    nombre: productoNombre,
    precio: parseFloat(productoPrecio)
  };
  
  document.getElementById('nuevoProductoEditar').value = productoNombre;
  ocultarSugerenciasEditar();
  
  mostrarToast(`Producto seleccionado: ${productoNombre}`, 'success');
}

function buscarProductoParaEditarAutocomplete() {
  const nombreProducto = document.getElementById('nuevoProductoEditar').value.trim();
  
  if (nombreProducto.length < 2) {
    ocultarSugerenciasEditar();
    return;
  }

  fetch(`/productos/buscar/?q=${encodeURIComponent(nombreProducto)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        mostrarSugerenciasEditar(data);
      } else {
        ocultarSugerenciasEditar();
      }
    })
    .catch(err => {
      console.error('Error en autocomplete:', err);
      ocultarSugerenciasEditar();
    });
}

function agregarProductoParaEditar() {
  if (!productoSeleccionadoParaEditar) {
    mostrarToast('Por favor busque y seleccione un producto primero', 'warning');
    return;
  }

  // Verificar si el producto ya está en la lista
  const filasActuales = document.querySelectorAll('#detallesEditar tr');
  for (let fila of filasActuales) {
    const productoId = fila.querySelector('.producto-id').value;
    if (productoId == productoSeleccionadoParaEditar.id) {
      mostrarToast('Este producto ya está en la lista', 'warning');
      return;
    }
  }

  // Generar índice único para la nueva fila
  const index = Date.now();
  
  const nuevaFila = `
    <tr id="detalle-${index}">
      <td>
        <input type="text" class="form-control" value="${productoSeleccionadoParaEditar.nombre}" readonly>
        <input type="hidden" class="producto-id" value="${productoSeleccionadoParaEditar.id}">
      </td>
      <td>
        <input type="number" class="form-control cantidad" value="1" min="1" 
               onchange="calcularSubtotal(${index})" data-precio="${productoSeleccionadoParaEditar.precio}">
      </td>
      <td>
        <input type="text" class="form-control" value="$${parseFloat(productoSeleccionadoParaEditar.precio).toFixed(2)}" readonly>
      </td>
      <td>
        <input type="text" class="form-control subtotal" value="$${parseFloat(productoSeleccionadoParaEditar.precio).toFixed(2)}" readonly>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarDetalle(${index})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `;

  // Agregar nueva fila a la tabla
  document.getElementById('detallesEditar').insertAdjacentHTML('beforeend', nuevaFila);
  
  // Limpiar búsqueda
  document.getElementById('nuevoProductoEditar').value = '';
  productoSeleccionadoParaEditar = null;
  
  // Actualizar total
  actualizarTotal();
  
  mostrarToast('Producto agregado correctamente', 'success');
}

function guardarCambiosVenta(ventaId) {
  const detalles = [];
  const filas = document.querySelectorAll('#detallesEditar tr');
  
  filas.forEach(fila => {
    const cantidad = parseInt(fila.querySelector('.cantidad').value) || 0;
    const precio = parseFloat(fila.querySelector('.cantidad').dataset.precio);
    const productoId = parseInt(fila.querySelector('.producto-id').value);
    
    if (cantidad > 0) {
      detalles.push({
        producto_id: productoId,
        cantidad: cantidad,
        precio_unitario: precio
      });
    }
  });
  
  if (detalles.length === 0) {
    mostrarToast('La venta debe tener al menos un producto', 'warning');
    return;
  }
  
  fetch(`/ventas/editar/${ventaId}/`, {
    method: 'PUT',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      detalles: detalles
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      mostrarToast('Venta actualizada correctamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('editarVentaModal')).hide();
      cargarVentasHoy(); // Recargar la tabla
    } else {
      mostrarToast(data.error || 'Error al actualizar venta', 'danger');
    }
  })
  .catch(err => {
    console.error('Error al actualizar venta:', err);
    mostrarToast('Error de conexión al actualizar venta', 'danger');
  });
}

function eliminarVenta(ventaId) {
  if (!confirm('¿Está seguro de eliminar esta venta? Esta acción no se puede deshacer.')) {
    return;
  }

  fetch(`/ventas/eliminar/${ventaId}/`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        mostrarToast('Venta eliminada correctamente', 'success');
        // Recargar ventas de hoy
        cargarVentasHoy();
      } else {
        mostrarToast(data.error || 'Error al eliminar venta', 'danger');
      }
    })
    .catch(err => {
      console.error('Error al eliminar venta:', err);
      mostrarToast('Error de conexión al eliminar venta', 'danger');
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
