// Control de Proveedores

let proveedoresActuales = [];

// Toast notification function
function mostrarToast(mensaje, tipo = 'info') {
  // Crear elemento toast si no existe
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    document.body.appendChild(toastContainer);
  }

  // Crear toast
  const toastId = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${tipo === 'danger' ? 'danger' : tipo === 'warning' ? 'warning' : tipo === 'success' ? 'success' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  
  // Mostrar y eliminar después de 3 segundos
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
  
  setTimeout(() => {
    toastElement.remove();
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  const btnGuardar = document.getElementById('btnGuardar');
  const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
  const busquedaInput = document.getElementById('busqueda');
  const filtroEstado = document.getElementById('filtroEstado');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

  btnGuardar.addEventListener('click', crearProveedor);
  btnGuardarEdicion.addEventListener('click', guardarEdicion);

  // Event listeners para filtros
  busquedaInput.addEventListener('input', aplicarFiltros);
  filtroEstado.addEventListener('change', aplicarFiltros);
  btnLimpiarFiltros.addEventListener('click', limpiarFiltros);

  cargarProveedores();
});

function aplicarFiltros() {
  const busqueda = document.getElementById('busqueda').value.toLowerCase().trim();
  const filtroEstado = document.getElementById('filtroEstado').value;

  console.log('Aplicando filtros:', { busqueda, filtroEstado });

  let proveedoresFiltrados = proveedoresActuales.filter(prov => {
    // Filtro por nombre
    if (busqueda && !prov.nombre.toLowerCase().includes(busqueda)) {
      return false;
    }

    // Filtro por estado
    if (filtroEstado === 'con_productos' && prov.productos === 0) {
      return false;
    }
    if (filtroEstado === 'sin_productos' && prov.productos > 0) {
      return false;
    }

    return true;
  });

  console.log('Proveedores filtrados:', proveedoresFiltrados.length);
  renderizarTabla(proveedoresFiltrados);
}

function limpiarFiltros() {
  console.log('Limpiando filtros');
  document.getElementById('busqueda').value = '';
  document.getElementById('filtroEstado').value = '';
  
  renderizarTabla(proveedoresActuales);
  mostrarToast('Filtros limpiados', 'info');
}

function cargarProveedores() {
  // Mostrar estado de carga
  const tbody = document.getElementById('cuerpoTabla');
  if (tbody) {
    tbody.innerHTML = '<tr class="text-center"><td colspan="5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
  }
  
  fetch('/proveedores/listar/')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((datos) => {
      console.log('Proveedores cargados:', datos);
      proveedoresActuales = datos;
      renderizarTabla(datos);
    })
    .catch((err) => {
      console.error('Error al cargar proveedores:', err);
      const tbody = document.getElementById('cuerpoTabla');
      if (tbody) {
        tbody.innerHTML = '<tr class="text-center text-danger"><td colspan="5">Error al cargar proveedores. Intente nuevamente.</td></tr>';
      }
      mostrarToast('Error al cargar proveedores', 'danger');
    });
}

function renderizarTabla(proveedores) {
  const tbody = document.getElementById('cuerpoTabla');

  if (proveedores.length === 0) {
    tbody.innerHTML =
      '<tr class="text-center text-muted"><td colspan="5">No se encontraron proveedores con los filtros aplicados</td></tr>';
    return;
  }

  let html = '';
  proveedores.forEach((prov, index) => {
    html += `
      <tr>
        <td>${prov.id}</td>
        <td><strong>${prov.nombre}</strong></td>
        <td>${prov.contacto}</td>
        <td>${prov.productos}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="abrirEditar(${prov.id})">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="eliminarProveedor(${prov.id})">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function crearProveedor() {
  console.log('=== CREAR PROVEEDOR ===');
  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();

  console.log('Datos recibidos:', { nombre, telefono, direccion });

  // Validaciones con mensajes específicos
  if (!nombre) {
    console.log('Error: Nombre vacío');
    mostrarToast('El nombre del proveedor es requerido', 'warning');
    return;
  }
  
  if (nombre.length < 3) {
    console.log('Error: Nombre muy corto');
    mostrarToast('El nombre debe tener al menos 3 caracteres', 'warning');
    return;
  }
  
  // Validar que el nombre no sea solo números
  if (/^\d+$/.test(nombre)) {
    console.log('Error: Nombre solo números');
    mostrarToast('El nombre no puede ser solo números', 'warning');
    return;
  }
  
  // Validar que el nombre tenga al menos una letra
  if (!/[a-zA-Z]/.test(nombre)) {
    console.log('Error: Nombre sin letras');
    mostrarToast('El nombre debe contener al menos una letra', 'warning');
    return;
  }
  
  if (!telefono) {
    console.log('Error: Teléfono vacío');
    mostrarToast('El teléfono es requerido', 'warning');
    return;
  }
  
  // Validar que el teléfono contenga solo números y caracteres válidos
  if (!/^[\d\-\s\(\)]+$/.test(telefono)) {
    console.log('Error: Teléfono inválido');
    mostrarToast('El teléfono solo puede contener números, guiones, espacios y paréntesis', 'warning');
    return;
  }
  
  if (telefono.length < 7) {
    console.log('Error: Teléfono muy corto');
    mostrarToast('El teléfono debe tener al menos 7 caracteres', 'warning');
    return;
  }

  const datos = {
    nombre: nombre,
    contacto: telefono,
    direccion: direccion,
  };

  console.log('Datos a enviar:', datos);

  fetch('/proveedores/crear/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    body: JSON.stringify(datos),
  })
    .then((res) => {
      console.log('Respuesta status:', res.status);
      return res.json();
    })
    .then((respuesta) => {
      console.log('Respuesta del servidor:', respuesta);
      if (respuesta.ok) {
        mostrarToast('Proveedor creado exitosamente', 'success');
        document.getElementById('formAgregar').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalAgregar')).hide();
        cargarProveedores();
      } else {
        console.log('Error en respuesta:', respuesta);
        mostrarToast(respuesta.error || 'Error al crear proveedor', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
    });
}

function abrirEditar(id) {
  const proveedor = proveedoresActuales.find(p => p.id == id);
  if (!proveedor) return;

  document.getElementById('editarId').value = id;
  document.getElementById('editarNombre').value = proveedor.nombre;
  document.getElementById('editarTelefono').value = proveedor.contacto;
  document.getElementById('editarDireccion').value = proveedor.direccion || '';

  const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
  modal.show();
}

function guardarEdicion() {
  console.log('=== GUARDAR EDICIÓN PROVEEDOR ===');
  const id = document.getElementById('editarId').value;
  const nombre = document.getElementById('editarNombre').value.trim();
  const telefono = document.getElementById('editarTelefono').value.trim();
  const direccion = document.getElementById('editarDireccion').value.trim();

  console.log('Datos recibidos:', { id, nombre, telefono, direccion });

  // Validaciones con mensajes específicos
  if (!id) {
    console.log('Error: ID vacío');
    mostrarToast('ID de proveedor no válido', 'warning');
    return;
  }

  if (!nombre) {
    console.log('Error: Nombre vacío');
    mostrarToast('El nombre del proveedor es requerido', 'warning');
    return;
  }
  
  if (nombre.length < 3) {
    console.log('Error: Nombre muy corto');
    mostrarToast('El nombre debe tener al menos 3 caracteres', 'warning');
    return;
  }
  
  // Validar que el nombre no sea solo números
  if (/^\d+$/.test(nombre)) {
    console.log('Error: Nombre solo números');
    mostrarToast('El nombre no puede ser solo números', 'warning');
    return;
  }
  
  // Validar que el nombre tenga al menos una letra
  if (!/[a-zA-Z]/.test(nombre)) {
    console.log('Error: Nombre sin letras');
    mostrarToast('El nombre debe contener al menos una letra', 'warning');
    return;
  }
  
  if (!telefono) {
    console.log('Error: Teléfono vacío');
    mostrarToast('El teléfono es requerido', 'warning');
    return;
  }
  
  // Validar que el teléfono contenga solo números y caracteres válidos
  if (!/^[\d\-\s\(\)]+$/.test(telefono)) {
    console.log('Error: Teléfono inválido');
    mostrarToast('El teléfono solo puede contener números, guiones, espacios y paréntesis', 'warning');
    return;
  }
  
  if (telefono.length < 7) {
    console.log('Error: Teléfono muy corto');
    mostrarToast('El teléfono debe tener al menos 7 caracteres', 'warning');
    return;
  }

  const datos = {
    nombre: nombre,
    contacto: telefono,
    direccion: direccion,
  };

  console.log('Datos a enviar:', datos);

  fetch(`/proveedores/editar/${id}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    body: JSON.stringify(datos),
  })
    .then((res) => {
      console.log('Respuesta status:', res.status);
      return res.json();
    })
    .then((respuesta) => {
      console.log('Respuesta del servidor:', respuesta);
      if (respuesta.ok) {
        mostrarToast('Proveedor actualizado exitosamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        cargarProveedores();
      } else {
        console.log('Error en respuesta:', respuesta);
        mostrarToast(respuesta.error || 'Error al actualizar', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
    });
}

function eliminarProveedor(id) {
  const proveedor = proveedoresActuales.find((p) => p.id === id);

  if (!proveedor) return;

  if (!confirm(`¿Eliminar proveedor "${proveedor.nombre}"?`)) {
    return;
  }

  fetch(`/proveedores/eliminar/${id}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
  })
    .then((res) => res.json())
    .then((respuesta) => {
      if (respuesta.ok) {
        mostrarToast(respuesta.mensaje || 'Proveedor eliminado', 'success');
        cargarProveedores();
      } else {
        mostrarToast(respuesta.error || 'Error al eliminar', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
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

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
