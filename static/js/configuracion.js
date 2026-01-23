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
  document.getElementById("btnGuardarUsuario").addEventListener("click", guardarUsuario);
  document.getElementById("btnGuardarRol")?.addEventListener("click", guardarRol);

  // Carga inicial
  cargarSeccion("usuarios");
});

// -------------------- FUNCIONES GENERALES --------------------
function cargarSeccion(seccion) {
  if (seccion === "usuarios") cargarUsuarios();
  else if (seccion === "roles") cargarRoles();
  else if (seccion === "auditoria") cargarAuditoria();
  else if (seccion === "sesiones") cargarSesiones();
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
      console.log('Usuarios recibidos:', datos);
      usuariosActuales = datos;
      renderizarTablaUsuarios();
    })
    .catch(error => {
      console.error('Error cargando usuarios:', error);
      const cont = document.getElementById("contenedorConfig");
      cont.innerHTML = `<p class="text-center text-danger">Error al cargar usuarios: ${error.message}</p>`;
    });
}

function renderizarTablaUsuarios() {
  const cont = document.getElementById("contenedorConfig");
  if (usuariosActuales.length === 0) {
    cont.innerHTML = '<p class="text-center text-muted">No hay usuarios registrados.</p>';
    return;
  }

  let html = `<div class="table-responsive"><table class="table table-hover align-middle">
    <thead class="table-light">
      <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr>
    </thead><tbody>`;

  usuariosActuales.forEach(u => {
    html += `<tr>
      <td>${u.nombre}</td>
      <td>${u.correo}</td>
      <td>${u.rol}</td>
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
  cont.innerHTML = html;
}

function abrirModalUsuario(id = null) {
  const modal = new bootstrap.Modal(document.getElementById("modalUsuario"));
  if (id) {
    const u = usuariosActuales.find(x => x.id === id);
    document.getElementById("tituloModalUsuario").textContent = "Editar Usuario";
    document.getElementById("usuarioId").value = u.id;
    document.getElementById("usuarioNombre").value = u.nombre;
    document.getElementById("usuarioCorreo").value = u.correo;
    document.getElementById("usuarioRol").value = u.rol;
  } else {
    document.getElementById("tituloModalUsuario").textContent = "Crear Usuario";
    document.getElementById("formUsuario").reset();
    document.getElementById("usuarioId").value = "";
  }
  modal.show();
}

function guardarUsuario() {
  const id = document.getElementById("usuarioId").value;
  const nombre = document.getElementById("usuarioNombre").value.trim();
  const correo = document.getElementById("usuarioCorreo").value.trim();
  const rol = document.getElementById("usuarioRol").value;

  if (!nombre || !correo) return mostrarToast("Complete todos los campos", "warning");

  const datos = { nombre, correo, rol };
  const url = id ? `/config/usuarios/editar/${id}/` : "/config/usuarios/crear/";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value,
    },
    body: JSON.stringify(datos),
  })
    .then(res => res.json())
    .then(respuesta => {
      if (respuesta.ok) {
        mostrarToast(`Usuario ${id ? "actualizado" : "creado"} correctamente`, "success");
        bootstrap.Modal.getInstance(document.getElementById("modalUsuario"))?.hide();
        cargarUsuarios();
      } else mostrarToast(respuesta.error || "Error", "danger");
    });
}

function eliminarUsuario(id) {
  if (!confirm("¿Deseas eliminar este usuario?")) return;

  fetch(`/config/usuarios/eliminar/${id}/`, {
    method: "POST",
    headers: { "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value },
  })
    .then(res => res.json())
    .then(respuesta => {
      if (respuesta.ok) {
        mostrarToast("Usuario eliminado", "success");
        cargarUsuarios();
      } else mostrarToast(respuesta.error || "Error", "danger");
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
        datos.forEach(a => html += `<tr><td>${a.usuario}</td><td>${a.accion}</td><td>${a.fecha}</td></tr>`);
        html += "</tbody></table></div>";
        cont.innerHTML = html;
      }
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