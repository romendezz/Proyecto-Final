// productos.js
document.addEventListener("DOMContentLoaded", function () {
    let toastSuccess, toastError;
    
    // Inicializar toasts si existen
    const toastSuccessEl = document.getElementById("toastSuccess");
    const toastErrorEl = document.getElementById("toastError");
    if (toastSuccessEl) toastSuccess = new bootstrap.Toast(toastSuccessEl);
    if (toastErrorEl) toastError = new bootstrap.Toast(toastErrorEl);
    
    let vistaActual = ''; // Guardar vista actual

    function mostrarToast(tipo, mensaje) {
        if (tipo === "success" && toastSuccess) {
            document.getElementById("toastSuccessMsg").innerText = mensaje;
            toastSuccess.show();
        } else if (tipo === "error" && toastError) {
            document.getElementById("toastErrorMsg").innerText = mensaje;
            toastError.show();
        } else {
            console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        }
    }

    function cerrarModal(idModal) {
        const modalEl = document.getElementById(idModal);
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    }

    // Detectar vista en URL
    const urlParams = new URLSearchParams(window.location.search);
    vistaActual = urlParams.get('ver') || 'todos';
    
    // Actualizar título si es necesario
    if (vistaActual === 'bajo-stock') {
        const titulo = document.querySelector('h2');
        if (titulo) {
            titulo.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Productos con Bajo Stock';
        }
    }

    // Cargar tabla con filtros: búsqueda, proveedor, stock
    function cargarTabla() {
        // Obtener valores de filtros
        const nombreBusqueda = (document.getElementById("busqueda")?.value || "").trim().toLowerCase();
        const proveedorFiltro = (document.getElementById("filtroProveedor")?.value || "").toLowerCase();
        const stockFiltro = document.getElementById("filtroStock")?.value || "";
        
        console.log("Filtros aplicados:", { nombreBusqueda, proveedorFiltro, stockFiltro });
        
        // Cargar todos los productos
        const url = `/productos/buscar/?q=`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                console.log("Productos cargados:", data.length);
                // Filtrar datos en cliente
                const filtrados = data.filter(p => {
                    // Filtro por nombre
                    const cumpleNombre = !nombreBusqueda || p.nombre.toLowerCase().includes(nombreBusqueda);
                    
                    // Filtro por proveedor
                    const cumpleProveedor = !proveedorFiltro || (p.proveedor && p.proveedor.toLowerCase().includes(proveedorFiltro));
                    
                    // Filtro por stock
                    let cumpleStock = true;
                    if (stockFiltro === 'agotado') {
                        cumpleStock = p.stock == 0;
                    } else if (stockFiltro === 'bajo') {
                        cumpleStock = p.stock > 0 && p.stock < 5;
                    } else if (stockFiltro === 'normal') {
                        cumpleStock = p.stock >= 5;
                    }
                    
                    return cumpleNombre && cumpleProveedor && cumpleStock;
                });
                
                console.log("Productos filtrados:", filtrados.length);
                renderTablaDesdeJSON(filtrados);
            })
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
                <tr data-id="${p.id}" data-proveedor-id="${p.proveedor_id}" class="${trClass}">
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
                document.getElementById("editarProveedor").value = tr.dataset.proveedorId;
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
        const nombre = document.getElementById("agregarNombre").value.trim();
        const precio = parseFloat(document.getElementById("agregarPrecio").value);
        const stock = parseInt(document.getElementById("agregarStock").value);
        const proveedor = document.getElementById("agregarProveedor").value;

        // Validaciones
        if (!nombre) {
            mostrarToast("error", "El nombre del producto es requerido");
            return;
        }
        if (nombre.length < 3) {
            mostrarToast("error", "El nombre debe tener al menos 3 caracteres");
            return;
        }
        if (isNaN(precio) || precio < 0) {
            mostrarToast("error", "Ingrese un precio válido");
            return;
        }
        if (isNaN(stock) || stock < 0) {
            mostrarToast("error", "Ingrese una cantidad válida");
            return;
        }
        if (!proveedor) {
            mostrarToast("error", "Seleccione un proveedor");
            return;
        }

        const data = {
            nombre: nombre,
            precio: precio,
            stock: stock,
            proveedor_id: proveedor
        };
        fetch("/productos/crear/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    mostrarToast("success", "Producto agregado exitosamente");
                    document.getElementById("modalAgregar").querySelector("form").reset();
                    cerrarModal("modalAgregar");
                    cargarTabla();
                } else {
                    mostrarToast("error", res.error || "Error al agregar producto");
                }
            })
            .catch(() => mostrarToast("error", "Error de conexión"));
    };

    // GUARDAR EDITAR
    document.getElementById("btnGuardarEditar").onclick = function () {
        const id = document.getElementById("editarId").value;
        const nombre = document.getElementById("editarNombre").value.trim();
        const precio = parseFloat(document.getElementById("editarPrecio").value);
        const stock = parseInt(document.getElementById("editarStock").value);

        // Validaciones
        if (!nombre) {
            mostrarToast("error", "El nombre del producto es requerido");
            return;
        }
        if (nombre.length < 3) {
            mostrarToast("error", "El nombre debe tener al menos 3 caracteres");
            return;
        }
        if (isNaN(precio) || precio < 0) {
            mostrarToast("error", "Ingrese un precio válido");
            return;
        }
        if (isNaN(stock) || stock < 0) {
            mostrarToast("error", "Ingrese una cantidad válida");
            return;
        }

        const data = {
            nombre: nombre,
            precio: precio,
            stock: stock,
            proveedor_id: document.getElementById("editarProveedor").value
        };
        fetch(`/productos/editar/${id}/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(res => {
                if (res.ok) {
                    mostrarToast("success", "Producto editado exitosamente");
                    cerrarModal("modalEditar");
                    cargarTabla();
                } else {
                    mostrarToast("error", res.error || "Error al editar producto");
                }
            })
            .catch(() => mostrarToast("error", "Error de conexión"));
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

    // FILTROS
    const busquedaEl = document.getElementById("busqueda");
    const filtroProveedorEl = document.getElementById("filtroProveedor");
    const filtroStockEl = document.getElementById("filtroStock");
    const btnLimpiarEl = document.getElementById("btnLimpiarFiltros");
    
    console.log("Elementos encontrados:", { 
        busquedaEl: !!busquedaEl, 
        filtroProveedorEl: !!filtroProveedorEl, 
        filtroStockEl: !!filtroStockEl, 
        btnLimpiarEl: !!btnLimpiarEl 
    });
    
    // Debounce para búsqueda (300ms)
    let timeoutBusqueda;
    if (busquedaEl) {
        busquedaEl.addEventListener("input", function() {
            console.log("INPUT en busqueda:", this.value);
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                console.log("Ejecutando cargarTabla después de debounce");
                cargarTabla();
            }, 300);
        });
        console.log("Event listener agregado a busqueda");
    } else {
        console.error("NO SE ENCONTRÓ elemento busqueda");
    }
    
    // Cambios inmediatos en filtros
    if (filtroProveedorEl) {
        filtroProveedorEl.addEventListener("change", function() {
            console.log("CHANGE en proveedor:", this.value);
            cargarTabla();
        });
        console.log("Event listener agregado a filtroProveedor");
    } else {
        console.error("NO SE ENCONTRÓ elemento filtroProveedor");
    }
    
    if (filtroStockEl) {
        filtroStockEl.addEventListener("change", function() {
            console.log("CHANGE en stock:", this.value);
            cargarTabla();
        });
        console.log("Event listener agregado a filtroStock");
    } else {
        console.error("NO SE ENCONTRÓ elemento filtroStock");
    }
    
    // Limpiar filtros
    if (btnLimpiarEl) {
        btnLimpiarEl.addEventListener("click", function(e) {
            e.preventDefault();
            console.log("CLICK en limpiar");
            if (busquedaEl) busquedaEl.value = '';
            if (filtroProveedorEl) filtroProveedorEl.value = '';
            if (filtroStockEl) filtroStockEl.value = '';
            cargarTabla();
        });
        console.log("Event listener agregado a btnLimpiar");
    } else {
        console.error("NO SE ENCONTRÓ elemento btnLimpiarFiltros");
    }

    // Cargar inicialmente
    console.log("=== Cargando tabla inicialmente ===");
    cargarTabla();
});