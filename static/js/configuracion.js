// Configuración - Admin (Usuarios, Roles, Auditoría, Sesiones)
let usuariosActuales = [];
let rolesActuales = [];
let auditoriaActual = [];
let sesionesActuales = [];

document.addEventListener("DOMContentLoaded", function () {
  // Tabs
  document.querySelectorAll("#tabsConfig .nav-link").forEach(tab => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll("#tabsConfig .nav-link").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      cargarSeccion(this.dataset.tab);
    });
  });

  // Botones modales
  const btnGuardar = document.getElementById("btnGuardarUsuario");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", guardarUsuario);
  }

  // Carga inicial
  cargarSeccion("usuarios");
});

// -------------------- FUNCIONES GENERALES --------------------
function cargarSeccion(seccion) {
  if (seccion === "usuarios") cargarUsuarios();
  else if (seccion === "auditoria") cargarAuditoria();
}

// Toast avanzado
function mostrarToast(mensaje, tipo = 'info') {
  const toast = document.getElementById("toastConfig");
  const body = toast.querySelector(".toast-body");

  // Iconos por tipo
  const iconos = { success: "✔️", warning: "⚠️", danger: "❌", info: "ℹ️" };
  body.innerHTML = `${iconos[tipo] || ''} ${mensaje}`;

  toast.className = `toast show align-items-center text-white bg-${tipo}`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// -------------------- USUARIOS --------------------
function cargarUsuarios() {
  fetch('/config/usuarios/')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(datos => {
      usuariosActuales = datos;
      renderizarTablaUsuarios();
    })
    .catch(error => {
      console.error('Error al cargar usuarios:', error);
      const cont = document.getElementById("contenedorConfig");
      cont.innerHTML = `<div class="alert alert-danger">Error al cargar usuarios: ${error.message}</div>`;
    });
}

function renderizarTablaUsuarios() {
  const cont = document.getElementById("contenedorConfig");
  let html = `<div class="d-flex justify-content-between align-items-center mb-3">
    <h5>Usuarios del Sistema</h5>
    <button class="btn btn-primary" onclick="abrirModalUsuario()">
      <i class="bi bi-plus-circle"></i> Agregar Usuario
    </button>
  </div>`;

  if (usuariosActuales.length === 0) {
    html += '<p class="text-center text-muted">No hay usuarios registrados.</p>';
  } else {
    html += `<div class="table-responsive"><table class="table table-hover align-middle">
      <thead class="table-light">
        <tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
      </thead><tbody>`;

    usuariosActuales.forEach(u => {
    html += `<tr>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.first_name || '-'}</td>
      <td>${u.rol}</td>
      <td><span class="badge ${u.is_active ? 'bg-success' : 'bg-secondary'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="abrirModalUsuario(${u.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${u.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  });

    html += "</tbody></table></div>";
  }
  cont.innerHTML = html;
}

function abrirModalUsuario(id = null) {
  const modal = new bootstrap.Modal(document.getElementById("modalUsuario"));
  if (id) {
    const u = usuariosActuales.find(x => x.id === id);
    document.getElementById("tituloModalUsuario").textContent = "Editar Usuario";
    document.getElementById("usuarioId").value = u.id;
    document.getElementById("usuarioNombre").value = u.username;
    document.getElementById("usuarioFirstName").value = u.first_name || '';
    document.getElementById("usuarioPassword").value = ""; // Limpiar contraseña al editar
    document.getElementById("usuarioRol").value = u.rol;
  } else {
    document.getElementById("tituloModalUsuario").textContent = "Crear Usuario";
    document.getElementById("formUsuario").reset();
    document.getElementById("usuarioId").value = "";
  }
  modal.show();
}

function guardarUsuario() {
  console.log('=== GUARDAR USUARIO ===');
  const id = document.getElementById("usuarioId").value;
  const username = document.getElementById("usuarioNombre").value.trim();
  const firstName = document.getElementById("usuarioFirstName").value.trim();
  const password = document.getElementById("usuarioPassword").value.trim();
  const rol = document.getElementById("usuarioRol").value;

  console.log('Datos:', { id, username, firstName, hasPassword: !!password, rol });

  if (!username) {
    console.log('Error: Username vacío');
    return mostrarToast("Complete todos los campos", "warning");
  }

  const datos = { username, first_name: firstName, rol };
  if (password) datos.password = password;
  
  const url = id ? `/config/usuarios/editar/${id}/` : "/config/usuarios/crear/";
  console.log('URL:', url);
  console.log('Datos a enviar:', datos);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  })
    .then(res => {
      console.log('Respuesta status:', res.status);
      return res.text().then(text => {
        console.log('Respuesta texto:', text);
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Error parsing JSON:', e);
          console.error('Response text:', text);
          throw new Error('Respuesta no es JSON válido');
        }
      });
    })
    .then(respuesta => {
      console.log('Respuesta del servidor:', respuesta);
      if (respuesta.ok) {
        mostrarToast(`Usuario ${id ? "actualizado" : "creado"} correctamente`, "success");
        bootstrap.Modal.getInstance(document.getElementById("modalUsuario"))?.hide();
        cargarUsuarios();
      } else {
        console.log('Error en respuesta:', respuesta);
        mostrarToast(respuesta.error || "Error", "danger");
      }
    })
    .catch(error => {
      console.error('Error en fetch:', error);
      mostrarToast("Error de conexión", "danger");
    });
}

function eliminarUsuario(id) {
  if (!confirm("¿Deseas eliminar este usuario?")) return;

  fetch(`/config/usuarios/eliminar/${id}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(res => res.json())
    .then(respuesta => {
      if (respuesta.ok) {
        mostrarToast("Usuario eliminado", "success");
        cargarUsuarios();
      } else mostrarToast(respuesta.error || "Error", "danger");
    })
    .catch(error => {
      console.error('Error al eliminar usuario:', error);
      mostrarToast("Error de conexión", "danger");
    });
}

// -------------------- ROLES --------------------
function cargarRoles() {
  fetch("/config/roles/")
    .then(res => res.json())
    .then(datos => {
      rolesActuales = datos;
      renderizarTablaRoles();
    });
}

function renderizarTablaRoles() {
  const cont = document.getElementById("contenedorConfig");
  if (!rolesActuales.length) {
    cont.innerHTML = '<p class="text-center text-muted">No hay roles registrados.</p>';
    return;
  }

  let html = `<div class="table-responsive"><table class="table table-hover align-middle">
    <thead class="table-light"><tr><th>Rol</th><th>Usuarios</th><th>Acciones</th></tr></thead><tbody>`;

  rolesActuales.forEach(r => {
    html += `<tr>
      <td>${r.nombre}</td>
      <td>${r.cantidad}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="abrirModalRol('${r.nombre}')">
          <i class="bi bi-pencil"></i> Editar
        </button>
      </td>
    </tr>`;
  });

  html += "</tbody></table></div>";
  cont.innerHTML = html;
}

function abrirModalRol(nombre = "") {
  const modal = new bootstrap.Modal(document.getElementById("modalRol"));
  document.getElementById("tituloModalRol").textContent = nombre ? "Editar Rol" : "Crear Rol";
  document.getElementById("rolNombre").value = nombre;
  modal.show();
}

function guardarRol() {
  const nombre = document.getElementById("rolNombre").value.trim();
  if (!nombre) return mostrarToast("Nombre del rol requerido", "warning");

  // Aquí puedes hacer fetch a Django para crear/editar rol
  mostrarToast(`Rol "${nombre}" guardado correctamente`, "success");
  bootstrap.Modal.getInstance(document.getElementById("modalRol"))?.hide();
  cargarRoles();
}

// -------------------- AUDITORÍA --------------------
function cargarAuditoria() {
  fetch("/config/auditoria/")
    .then(res => res.json())
    .then(datos => {
      auditoriaActual = datos;
      const cont = document.getElementById("contenedorConfig");
      if (!datos.length) cont.innerHTML = '<p class="text-center text-muted">No hay registros.</p>';
      else {
        let html = `<div class="table-responsive"><table class="table table-hover">
          <thead><tr><th>Usuario</th><th>Acción</th><th>Fecha/Hora</th></tr></thead><tbody>`;
        datos.forEach(a => {
          const fecha = a.fecha ? new Date(a.fecha).toLocaleString() : 'N/A';
          html += `<tr><td>${a.usuario}</td><td>${a.accion}</td><td>${fecha}</td></tr>`;
        });
        html += "</tbody></table></div>";
        cont.innerHTML = html;
      }
    })
    .catch(error => {
      console.error('Error al cargar auditoría:', error);
      const cont = document.getElementById("contenedorConfig");
      cont.innerHTML = `<div class="alert alert-danger">Error al cargar auditoría: ${error.message}</div>`;
    });
}

// -------------------- SESIONES --------------------
function cargarSesiones() {
  fetch("/config/sesiones/")
    .then(res => res.json())
    .then(datos => {
      sesionesActuales = datos;
      const cont = document.getElementById("contenedorConfig");
      if (!datos.length) cont.innerHTML = '<p class="text-center text-muted">No hay sesiones activas.</p>';
      else {
        let html = `<div class="table-responsive"><table class="table table-hover">
          <thead><tr><th>Usuario</th><th>IP</th><th>Última actividad</th><th>Acciones</th></tr></thead><tbody>`;
        datos.forEach(s => {
          html += `<tr>
            <td>${s.usuario}</td><td>${s.ip}</td><td>${s.ultima_vez}</td>
            <td><button class="btn btn-sm btn-danger" onclick="cerrarSesion(${s.id})">
            <i class="bi bi-x-circle"></i> Cerrar</button></td>
          </tr>`;
        });
        html += "</tbody></table></div>";
        cont.innerHTML = html;
      }
    });
}

function cerrarSesion(id) {
  if (!confirm("¿Cerrar sesión de este usuario?")) return;
  fetch(`/config/sesiones/cerrar/${id}/`, {
    method: "POST",
    headers: { "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value },
  })
    .then(res => res.json())
    .then(respuesta => {
      if (respuesta.ok) {
        mostrarToast("Sesión cerrada", "success");
        cargarSesiones();
      } else mostrarToast(respuesta.error || "Error", "danger");
    });
}