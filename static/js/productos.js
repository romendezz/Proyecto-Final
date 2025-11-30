// productos.js
document.addEventListener("DOMContentLoaded", function () {
    const toastSuccess = new bootstrap.Toast(document.getElementById("toastSuccess"));
    const toastError = new bootstrap.Toast(document.getElementById("toastError"));

    function mostrarToast(tipo, mensaje) {
        if (tipo === "success") {
            document.getElementById("toastSuccessMsg").innerText = mensaje;
            toastSuccess.show();
        } else {
            document.getElementById("toastErrorMsg").innerText = mensaje;
            toastError.show();
        }
    }

    function cerrarModal(idModal) {
        const modalEl = document.getElementById(idModal);
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    }

    // Cargar tabla vía AJAX — sólo búsqueda por nombre (sin filtros de precio/orden)
    function cargarTabla() {
        const qValue = document.getElementById("busqueda").value || "";
        const url = `/productos/buscar/?q=${encodeURIComponent(qValue)}`;
        fetch(url)
            .then(res => res.json())
            .then(data => renderTablaDesdeJSON(data))
            .catch(() => mostrarToast("error", "Error al cargar productos"));
    }

    function renderTablaDesdeJSON(data) {
        const tbody = document.querySelector("#contenedorTabla tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay productos</td></tr>';
            return;
        }
        data.forEach(p => {
            const stockNum = Number(p.stock);
            const trClass = stockNum === 0 ? 'table-danger' : '';
            tbody.insertAdjacentHTML('beforeend', `
                <tr data-id="${p.id}" class="${trClass}">
                    <td>${p.id}</td>
                    <td class="td-nombre">${p.nombre}</td>
                    <td class="td-precio">${p.precio}</td>
                    <td class="td-stock">${p.stock}</td>
                    <td class="td-proveedor">${p.proveedor || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btnEditar" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger btn-sm btnEliminar" data-id="${p.id}"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `);
        });
        asignarEventos();
    }

    function asignarEventos() {
        document.querySelectorAll(".btnEditar").forEach(btn => {
            btn.onclick = function () {
                const tr = this.closest("tr");
                document.getElementById("editarId").value = tr.dataset.id;
                document.getElementById("editarNombre").value = tr.querySelector('.td-nombre').innerText;
                document.getElementById("editarPrecio").value = tr.querySelector('.td-precio').innerText;
                document.getElementById("editarStock").value = tr.querySelector('.td-stock').innerText;
                document.getElementById("editarProveedor").value = tr.querySelector('.td-proveedor').innerText;
                new bootstrap.Modal(document.getElementById("modalEditar")).show();
            }
        });

        document.querySelectorAll(".btnEliminar").forEach(btn => {
            btn.onclick = function () {
                document.getElementById("btnConfirmarEliminar").dataset.id = this.closest("tr").dataset.id;
                new bootstrap.Modal(document.getElementById("modalEliminar")).show();
            }
        });
    }

    // AGREGAR
    document.getElementById("btnGuardarAgregar").onclick = function () {
        const data = {
            nombre: document.getElementById("agregarNombre").value,
            precio: parseFloat(document.getElementById("agregarPrecio").value) || 0,
            stock: parseInt(document.getElementById("agregarStock").value) || 0,
            proveedor: document.getElementById("agregarProveedor").value
        };
        fetch("/productos/crear/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    mostrarToast("success", "Producto agregado");
                    document.getElementById("modalAgregar").querySelector("form").reset();
                    cerrarModal("modalAgregar");
                    cargarTabla();
                }
            })
            .catch(() => mostrarToast("error", "Error al agregar"));
    }

    // GUARDAR EDITAR
    document.getElementById("btnGuardarEditar").onclick = function () {
        const id = document.getElementById("editarId").value;
        const data = {
            nombre: document.getElementById("editarNombre").value,
            precio: parseFloat(document.getElementById("editarPrecio").value) || 0,
            stock: parseInt(document.getElementById("editarStock").value) || 0,
            proveedor: document.getElementById("editarProveedor").value
        };
        fetch(`/productos/editar/${id}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    mostrarToast("success", "Producto editado");
                    cerrarModal("modalEditar");
                    cargarTabla();
                }
            })
            .catch(() => mostrarToast("error", "Error al editar"));
    }

    // CONFIRMAR ELIMINAR
    document.getElementById("btnConfirmarEliminar").onclick = function () {
        const id = this.dataset.id;
        fetch(`/productos/eliminar/${id}/`, { method: "POST" })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    mostrarToast("success", "Producto eliminado");
                    cerrarModal("modalEliminar");
                    cargarTabla();
                }
            })
            .catch(() => mostrarToast("error", "Error al eliminar"));
    }

    // BÚSQUEDA
    document.getElementById("busqueda").oninput = cargarTabla;

    // Cargar inicialmente
    cargarTabla();
});