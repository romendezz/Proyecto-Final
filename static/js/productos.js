// productos.js
document.addEventListener("DOMContentLoaded", function () {
    // Inicializar toasts
    window.toastSuccess = new bootstrap.Toast(document.getElementById('toastSuccess'));
    window.toastError = new bootstrap.Toast(document.getElementById('toastError'));
    
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
        
        // Mostrar estado de carga
        const tbody = document.querySelector("#contenedorTabla tbody");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
        }
        
        // Cargar todos los productos
        const url = `/productos/buscar/?q=`;
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
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
            .catch(error => {
                console.error('Error al cargar productos:', error);
                const tbody = document.querySelector("#contenedorTabla tbody");
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar productos. Intente nuevamente.</td></tr>';
                }
                mostrarToast("error", "Error al cargar productos");
            });
    }

    function renderTablaDesdeJSON(data) {
        const tbody = document.querySelector("#contenedorTabla tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!data || data.length === 0) {
            const isStaff = document.body.dataset.userStaff === 'true';
            const colspan = isStaff ? 6 : 5;
            tbody.innerHTML = `<tr><td colspan="${colspan}">No hay productos</td></tr>`;
            return;
        }
        data.forEach(p => {
            const stockNum = Number(p.stock);
            const trClass = stockNum === 0 ? 'table-danger' : '';
            const isStaff = document.body.dataset.userStaff === 'true';
            
            tbody.insertAdjacentHTML('beforeend', `
                <tr data-id="${p.id}" data-proveedor-id="${p.proveedor_id}" class="${trClass}">
                    <td>${p.id}</td>
                    <td class="td-nombre">${p.nombre}</td>
                    <td class="td-precio">${p.precio}</td>
                    <td class="td-stock">${p.stock}</td>
                    <td class="td-proveedor">${p.proveedor || ''}</td>
                    <td>
                        ${isStaff ? `
                            <button class="btn btn-warning btn-sm btnEditar" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-danger btn-sm btnEliminar" data-id="${p.id}"><i class="bi bi-trash"></i></button>
                        ` : ''}
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
                const productoId = tr.dataset.id;
                const proveedorIdActual = tr.dataset.proveedorId;
                const nombreProveedorActual = tr.dataset.proveedorNombre || '';
                
                document.getElementById("editarId").value = productoId;
                document.getElementById("editarNombre").value = tr.querySelector('.td-nombre').innerText;
                document.getElementById("editarPrecio").value = tr.querySelector('.td-precio').innerText;
                document.getElementById("editarStock").value = tr.querySelector('.td-stock').innerText;
                
                // Manejar proveedor en edición
                const selectProveedor = document.getElementById("editarProveedor");
                const mensajeProveedor = document.getElementById("mensajeProveedorActual");
                const nombreProveedorSpan = document.getElementById("nombreProveedorActual");
                
                // Obtener todas las opciones originales del modal
                const opcionesOriginales = Array.from(selectProveedor.querySelectorAll('option[data-nombre]'));
                
                // Limpiar y reconstruir el select
                selectProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>';
                
                // Mostrar mensaje del proveedor actual y filtrar opciones
                if (proveedorIdActual && nombreProveedorActual) {
                    nombreProveedorSpan.textContent = nombreProveedorActual;
                    mensajeProveedor.style.display = 'block';
                    
                    // Agregar solo proveedores diferentes al actual
                    opcionesOriginales.forEach(opcion => {
                        if (opcion.value !== proveedorIdActual) {
                            selectProveedor.appendChild(opcion.cloneNode(true));
                        }
                    });
                    
                    selectProveedor.value = ''; // No seleccionar ningún proveedor
                } else {
                    mensajeProveedor.style.display = 'none';
                    // Si no tiene proveedor, mostrar todas las opciones
                    opcionesOriginales.forEach(opcion => {
                        selectProveedor.appendChild(opcion.cloneNode(true));
                    });
                }
                
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
    const btnGuardarAgregar = document.getElementById("btnGuardarAgregar");
    if (btnGuardarAgregar) {
        btnGuardarAgregar.onclick = function () {
            console.log('=== GUARDAR PRODUCTO ===');
            const nombre = document.getElementById("agregarNombre").value.trim();
            const precioStr = document.getElementById("agregarPrecio").value;
            const stockStr = document.getElementById("agregarStock").value;
            const proveedor = document.getElementById("agregarProveedor").value;

            console.log('Datos recibidos:', { nombre, precioStr, stockStr, proveedor });

            // Validaciones con mensajes específicos
            if (!nombre) {
            console.log('Error: Nombre vacío');
            mostrarToast("error", "El nombre del producto es requerido");
            return;
        }
        
        // Validar que el nombre no contenga solo números
        if (/^\d+$/.test(nombre)) {
            console.log('Error: Nombre solo números');
            mostrarToast("error", "El nombre no puede ser solo números");
            return;
        }
        
        if (nombre.length < 3) {
            console.log('Error: Nombre muy corto');
            mostrarToast("error", "El nombre debe tener al menos 3 caracteres");
            return;
        }
        
        // Validar que el nombre tenga al menos una letra
        if (!/[a-zA-Z]/.test(nombre)) {
            console.log('Error: Nombre sin letras');
            mostrarToast("error", "El nombre debe contener al menos una letra");
            return;
        }

        // Validar precio
        const precio = parseFloat(precioStr);
        if (precioStr === '' || precioStr === null || precioStr === undefined) {
            console.log('Error: Precio vacío');
            mostrarToast("error", "El precio es requerido");
            return;
        }
        
        if (isNaN(precio)) {
            console.log('Error: Precio no es número');
            mostrarToast("error", "El precio debe ser un número válido");
            return;
        }
        
        if (precio < 0) {
            console.log('Error: Precio negativo');
            mostrarToast("error", "El precio no puede ser negativo");
            return;
        }
        
        if (precio > 999999) {
            console.log('Error: Precio muy alto');
            mostrarToast("error", "El precio no puede ser mayor a $999,999");
            return;
        }

        // Validar stock
        const stock = parseInt(stockStr);
        if (stockStr === '' || stockStr === null || stockStr === undefined) {
            console.log('Error: Stock vacío');
            mostrarToast("error", "El stock es requerido");
            return;
        }
        
        if (isNaN(stock)) {
            console.log('Error: Stock no es número');
            mostrarToast("error", "El stock debe ser un número válido");
            return;
        }
        
        if (stock < 0) {
            console.log('Error: Stock negativo');
            mostrarToast("error", "El stock no puede ser negativo");
            return;
        }
        
        if (stock > 999999) {
            console.log('Error: Stock muy alto');
            mostrarToast("error", "El stock no puede ser mayor a 999,999");
            return;
        }

        // Validar proveedor
        if (!proveedor) {
            console.log('Error: Proveedor no seleccionado');
            mostrarToast("error", "Seleccione un proveedor");
            return;
        }
        
        if (!/^\d+$/.test(proveedor)) {
            console.log('Error: Proveedor inválido');
            mostrarToast("error", "Seleccione un proveedor válido");
            return;
        }

        const data = {
            nombre: nombre,
            precio: precio,
            stock: stock,
            proveedor_id: proveedor
        };

        console.log('Datos a enviar:', data);
        console.log('URL: /productos/crear/');

        fetch("/productos/crear/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify(data)
        })
            .then(res => {
                console.log('Respuesta status:', res.status);
                return res.json();
            })
            .then(res => {
                console.log('Respuesta del servidor:', res);
                if (res.ok) {
                    mostrarToast("success", "Producto agregado exitosamente");
                    document.getElementById("modalAgregar").querySelector("form").reset();
                    cerrarModal("modalAgregar");
                    cargarTabla();
                } else {
                    console.log('Error en respuesta:', res);
                    mostrarToast("error", res.error || "Error al agregar producto");
                }
            })
            .catch(err => {
                console.error('Error en fetch:', err);
                mostrarToast("error", "Error de conexión");
            });
        };
    }

    // GUARDAR EDITAR
    const btnGuardarEditar = document.getElementById("btnGuardarEditar");
    if (btnGuardarEditar) {
        btnGuardarEditar.onclick = function () {
        console.log('=== EDITAR PRODUCTO ===');
        const id = document.getElementById("editarId").value;
        const nombre = document.getElementById("editarNombre").value.trim();
        const precioStr = document.getElementById("editarPrecio").value;
        const stockStr = document.getElementById("editarStock").value;
        const proveedor = document.getElementById("editarProveedor").value;

        console.log('Datos recibidos:', { id, nombre, precioStr, stockStr, proveedor });

        // Validaciones con mensajes específicos
        if (!id) {
            console.log('Error: ID vacío');
            mostrarToast("error", "ID de producto no válido");
            return;
        }

        if (!nombre) {
            console.log('Error: Nombre vacío');
            mostrarToast("error", "El nombre del producto es requerido");
            return;
        }
        
        // Validar que el nombre no contenga solo números
        if (/^\d+$/.test(nombre)) {
            console.log('Error: Nombre solo números');
            mostrarToast("error", "El nombre no puede ser solo números");
            return;
        }
        
        if (nombre.length < 3) {
            console.log('Error: Nombre muy corto');
            mostrarToast("error", "El nombre debe tener al menos 3 caracteres");
            return;
        }
        
        // Validar que el nombre tenga al menos una letra
        if (!/[a-zA-Z]/.test(nombre)) {
            console.log('Error: Nombre sin letras');
            mostrarToast("error", "El nombre debe contener al menos una letra");
            return;
        }

        // Validar precio
        const precio = parseFloat(precioStr);
        if (precioStr === '' || precioStr === null || precioStr === undefined) {
            console.log('Error: Precio vacío');
            mostrarToast("error", "El precio es requerido");
            return;
        }
        
        if (isNaN(precio)) {
            console.log('Error: Precio no es número');
            mostrarToast("error", "El precio debe ser un número válido");
            return;
        }
        
        if (precio < 0) {
            console.log('Error: Precio negativo');
            mostrarToast("error", "El precio no puede ser negativo");
            return;
        }
        
        if (precio > 999999) {
            console.log('Error: Precio muy alto');
            mostrarToast("error", "El precio no puede ser mayor a $999,999");
            return;
        }

        // Validar stock
        const stock = parseInt(stockStr);
        if (stockStr === '' || stockStr === null || stockStr === undefined) {
            console.log('Error: Stock vacío');
            mostrarToast("error", "El stock es requerido");
            return;
        }
        
        if (isNaN(stock)) {
            console.log('Error: Stock no es número');
            mostrarToast("error", "El stock debe ser un número válido");
            return;
        }
        
        if (stock < 0) {
            console.log('Error: Stock negativo');
            mostrarToast("error", "El stock no puede ser negativo");
            return;
        }
        
        if (stock > 999999) {
            console.log('Error: Stock muy alto');
            mostrarToast("error", "El stock no puede ser mayor a 999,999");
            return;
        }

        // Validar proveedor (solo si se selecciona uno diferente)
        if (proveedor && !/^\d+$/.test(proveedor)) {
            console.log('Error: Proveedor inválido');
            mostrarToast("error", "Seleccione un proveedor válido");
            return;
        }

        const data = {
            nombre: nombre,
            precio: precio,
            stock: stock,
            proveedor_id: proveedor || null
        };

        console.log('Datos a enviar:', data);
        console.log('URL:', `/productos/editar/${id}/`);

        fetch(`/productos/editar/${id}/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify(data)
        })
            .then(res => {
                console.log('Respuesta status:', res.status);
                return res.json();
            })
            .then(res => {
                console.log('Respuesta del servidor:', res);
                if (res.ok) {
                    mostrarToast("success", "Producto editado exitosamente");
                    cerrarModal("modalEditar");
                    cargarTabla();
                } else {
                    console.log('Error en respuesta:', res);
                    mostrarToast("error", res.error || "Error al editar producto");
                }
            })
            .catch(err => {
                console.error('Error en fetch:', err);
                mostrarToast("error", "Error de conexión");
            });
        };
    }

    // CONFIRMAR ELIMINAR
    const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.onclick = function () {
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
        };
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