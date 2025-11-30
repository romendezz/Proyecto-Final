// Reportes - Generación de reportes

document.addEventListener('DOMContentLoaded', function() {
    const btnGenerar = document.getElementById("btnGenerar");
    if (btnGenerar) {
        btnGenerar.addEventListener("click", generarReporte);
    }
});

function generarReporte() {
    const tipo = document.getElementById("tipoReporte").value;

    let datos = [];

    // Datos ficticios para simular reportes
    if (tipo === "ventasDia") {
        datos = [
            ["01/11/2025", "$150", "23 ventas"],
            ["02/11/2025", "$210", "31 ventas"],
            ["03/11/2025", "$98", "14 ventas"]
        ];
    } 
    else if (tipo === "ventasMes") {
        datos = [
            ["Noviembre", "$4,100", "450 ventas"],
            ["Octubre", "$3,900", "420 ventas"]
        ];
    }
    else if (tipo === "masVendidos") {
        datos = [
            ["Café americano", "120 unidades", "$300"],
            ["Capuchino", "95 unidades", "$270"],
            ["Pan con queso", "80 unidades", "$160"]
        ];
    }
    else if (tipo === "clientes") {
        datos = [
            ["Juan Pérez", "5 compras", "$22"],
            ["María López", "9 compras", "$35"],
            ["Ana Torres", "3 compras", "$11"]
        ];
    }

    // Llenar tabla
    const tbody = document.querySelector("#tablaReporte tbody");
    tbody.innerHTML = "";

    datos.forEach(fila => {
        const tr = document.createElement("tr");
        fila.forEach(col => {
            const td = document.createElement("td");
            td.textContent = col;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}
