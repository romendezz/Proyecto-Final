// Control de Proveedores

let proveedoresActuales = [];

document.addEventListener('DOMContentLoaded', function () {
  const btnAgregar = document.getElementById('btnAgregar');
  const formProveedor = document.getElementById('formProveedor');
  const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');

  btnAgregar.addEventListener('click', crearProveedor);
  btnGuardarEdicion.addEventListener('click', guardarEdicion);

  cargarProveedores();
});

function cargarProveedores() {
  fetch('/proveedores/listar/')
    .then((res) => res.json())
    .then((datos) => {
      proveedoresActuales = datos;
      renderizarTabla(datos);
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error al cargar proveedores', 'danger');
    });
}

function renderizarTabla(proveedores) {
  const tbody = document.getElementById('cuerpoTabla');

  if (proveedores.length === 0) {
    tbody.innerHTML =
      '<tr class="text-center text-muted"><td colspan="6">No hay proveedores registrados</td></tr>';
    return;
  }

  let html = '';
  proveedores.forEach((prov, index) => {
    html += `
      <tr>
        <td>${prov.id}</td>
        <td><strong>${prov.nombre}</strong></td>
        <td>${prov.contacto}</td>
        <td>${prov.email || '-'}</td>
        <td><span class="badge bg-info">${prov.productos}</span></td>
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
  const nombre = document.getElementById('nombreProv').value.trim();
  const contacto = document.getElementById('telefonoProv').value.trim();
  const email = document.getElementById('emailProv').value.trim();

  // Validaciones
  if (!nombre) {
    mostrarToast('El nombre del proveedor es requerido', 'warning');
    return;
  }
  if (nombre.length < 3) {
    mostrarToast('El nombre debe tener al menos 3 caracteres', 'warning');
    return;
  }
  if (!contacto) {
    mostrarToast('El contacto/teléfono es requerido', 'warning');
    return;
  }
  if (email && !validarEmail(email)) {
    mostrarToast('Ingrese un email válido', 'warning');
    return;
  }

  const datos = {
    nombre: nombre,
    contacto: contacto,
    email: email,
  };

  fetch('/proveedores/crear/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    body: JSON.stringify(datos),
  })
    .then((res) => res.json())
    .then((respuesta) => {
      if (respuesta.ok) {
        mostrarToast('Proveedor creado exitosamente', 'success');
        document.getElementById('formProveedor').reset();
        cargarProveedores();
      } else {
        mostrarToast(respuesta.error || 'Error al crear proveedor', 'danger');
      }
    })
    .catch((err) => {
      console.error('Error:', err);
      mostrarToast('Error de conexión', 'danger');
    });
}

function abrirEditar(id) {
  const proveedor = proveedoresActuales.find((p) => p.id === id);

  if (!proveedor) return;

  document.getElementById('editarId').value = id;
  document.getElementById('editarNombre').value = proveedor.nombre;
  document.getElementById('editarContacto').value = proveedor.contacto;
  document.getElementById('editarEmail').value = proveedor.email || '';

  const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
  modal.show();
}

function guardarEdicion() {
  const id = document.getElementById('editarId').value;
  const nombre = document.getElementById('editarNombre').value.trim();
  const contacto = document.getElementById('editarContacto').value.trim();
  const email = document.getElementById('editarEmail').value.trim();

  // Validaciones
  if (!nombre) {
    mostrarToast('El nombre del proveedor es requerido', 'warning');
    return;
  }
  if (nombre.length < 3) {
    mostrarToast('El nombre debe tener al menos 3 caracteres', 'warning');
    return;
  }
  if (!contacto) {
    mostrarToast('El contacto/teléfono es requerido', 'warning');
    return;
  }
  if (email && !validarEmail(email)) {
    mostrarToast('Ingrese un email válido', 'warning');
    return;
  }

  const datos = {
    nombre: nombre,
    contacto: contacto,
    email: email,
  };

  fetch(`/proveedores/editar/${id}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    body: JSON.stringify(datos),
  })
    .then((res) => res.json())
    .then((respuesta) => {
      if (respuesta.ok) {
        mostrarToast('Proveedor actualizado exitosamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        cargarProveedores();
      } else {
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
