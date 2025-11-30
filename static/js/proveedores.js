// Proveedores - Gestión de proveedores

document.addEventListener('DOMContentLoaded', function() {
    const btnAgregar = document.getElementById("btnAgregar");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", agregarProveedor);
    }
});

function agregarProveedor() {
    const nombre = document.getElementById("nombreProv").value.trim();
    const telefono = document.getElementById("telefonoProv").value.trim();
    const producto = document.getElementById("productoProv").value.trim();

    if (!nombre || !telefono || !producto) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    const tbody = document.querySelector("#tablaProveedores tbody");

    // Eliminar mensaje inicial
    if (tbody.children.length === 1 && tbody.children[0].textContent.includes("Aún")) {
        tbody.innerHTML = "";
    }

    // Crear fila
    const fila = document.createElement("tr");

    fila.innerHTML = `
        <td>${nombre}</td>
        <td>${telefono}</td>
        <td>${producto}</td>
        <td class="acciones">
            <button class="btnEditar">Editar</button>
            <button class="btnEliminar">Eliminar</button>
        </td>
    `;

    // Botón eliminar
    fila.querySelector(".btnEliminar").addEventListener("click", () => {
        if (confirm("¿Deseas eliminar este proveedor?")) {
            fila.remove();
        }
    });

    // Botón editar
    fila.querySelector(".btnEditar").addEventListener("click", () => {
        const nuevoNombre = prompt("Nuevo nombre:", nombre);
        const nuevoTelefono = prompt("Nuevo teléfono:", telefono);
        const nuevoProducto = prompt("Nuevo producto:", producto);

        if (nuevoNombre && nuevoTelefono && nuevoProducto) {
            fila.children[0].textContent = nuevoNombre;
            fila.children[1].textContent = nuevoTelefono;
            fila.children[2].textContent = nuevoProducto;
        }
    });

    tbody.appendChild(fila);

    // Limpiar formulario
    document.getElementById("nombreProv").value = "";
    document.getElementById("telefonoProv").value = "";
    document.getElementById("productoProv").value = "";
}
