// Reportes - Gráficos y estadísticas

let graficoVentasMes = null;
let graficoProductosTop = null;

function cargarReporteVentas() {
  fetch('/reportes/estadisticas/')
    .then((res) => res.json())
    .then((datos) => {
      if (datos.ok) {
        actualizarResumenVentas(datos);
        crearGraficos(datos);
        cargarUltimasVentas();
      } else {
        console.error('Error:', datos.error);
      }
    })
    .catch((err) => {
      console.error('Error:', err);
    });
}

function cargarReporteInventario() {
  fetch('/reportes/inventario/')
    .then((res) => res.json())
    .then((datos) => {
      if (datos.ok) {
        mostrarInventario(datos);
      } else {
        console.error('Error:', datos.error);
      }
    })
    .catch((err) => {
      console.error('Error:', err);
    });
}

function cargarReporteGanancias() {
  fetch('/reportes/ganancias/')
    .then((res) => res.json())
    .then((datos) => {
      if (datos.ok) {
        mostrarGanancias(datos);
      } else {
        console.error('Error:', datos.error);
      }
    })
    .catch((err) => {
      console.error('Error:', err);
    });
}

function actualizarResumenVentas(datos) {
  const html = `
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-primary">
            <i class="bi bi-receipt-cutoff"></i>
          </div>
          <h6>Total de Ventas</h6>
          <h3>${datos.total_ventas}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-success">
            <i class="bi bi-cash-coin"></i>
          </div>
          <h6>Ingresos</h6>
          <h3>$${parseFloat(datos.ingresos_totales).toFixed(2)}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-info">
            <i class="bi bi-box-seam"></i>
          </div>
          <h6>Productos</h6>
          <h3 id="totalProductos">0</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-warning">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <h6>Stock Bajo</h6>
          <h3>${datos.stock_bajo}</h3>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-graph-up"></i> Ventas por Mes</h5>
          </div>
          <div class="card-body">
            <canvas id="graficoVentasMes"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="bi bi-pie-chart"></i> Top 10 Productos</h5>
          </div>
          <div class="card-body">
            <canvas id="graficoProductosTop"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('contenedorReporte').innerHTML = html;
  
  // Contar total de productos
  fetch('/productos/buscar/?q=')
    .then((res) => res.json())
    .then((productos) => {
      document.getElementById('totalProductos').textContent = productos.length;
    });
}

function mostrarInventario(datos) {
  const html = `
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-info">
            <i class="bi bi-box-seam"></i>
          </div>
          <h6>Total Productos</h6>
          <h3>${datos.total_productos}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-success">
            <i class="bi bi-stack"></i>
          </div>
          <h6>Stock Total</h6>
          <h3>${datos.stock_total}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-primary">
            <i class="bi bi-cash-coin"></i>
          </div>
          <h6>Valor Inventario</h6>
          <h3>$${parseFloat(datos.valor_inventario).toFixed(2)}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-danger">
            <i class="bi bi-exclamation-circle"></i>
          </div>
          <h6>Agotados</h6>
          <h3>${datos.productos_agotados}</h3>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0"><i class="bi bi-list-ul"></i> Inventario Completo</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Precio Unit.</th>
                    <th>Proveedor</th>
                    <th>Valor Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody id="tablaInventario"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('contenedorReporte').innerHTML = html;
  
  // Llenar tabla de inventario
  const tbody = document.getElementById('tablaInventario');
  let html_filas = '';
  datos.productos.forEach((p) => {
    const badgeClass = p.estado === 'Agotado' ? 'bg-danger' : (p.estado === 'Bajo' ? 'bg-warning' : 'bg-success');
    html_filas += `
      <tr>
        <td>#${p.id}</td>
        <td><strong>${p.nombre}</strong></td>
        <td>${p.stock}</td>
        <td>$${parseFloat(p.precio).toFixed(2)}</td>
        <td>${p.proveedor}</td>
        <td>$${parseFloat(p.valor).toFixed(2)}</td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
      </tr>
    `;
  });
  tbody.innerHTML = html_filas;
}

function mostrarGanancias(datos) {
  const html = `
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-success">
            <i class="bi bi-cash-coin"></i>
          </div>
          <h6>Ganancia Total</h6>
          <h3>$${parseFloat(datos.ganancia_total).toFixed(2)}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-primary">
            <i class="bi bi-calculator"></i>
          </div>
          <h6>Promedio Venta</h6>
          <h3>$${parseFloat(datos.promedio_venta).toFixed(2)}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-info">
            <i class="bi bi-receipt-cutoff"></i>
          </div>
          <h6>Transacciones</h6>
          <h3>${datos.total_transacciones}</h3>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <div class="metric-icon bg-warning">
            <i class="bi bi-star-fill"></i>
          </div>
          <h6>Producto Top</h6>
          <h3 style="font-size: 1.9rem;">${datos.producto_mas_rentable.nombre}</h3>
        </div>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="bi bi-graph-up"></i> Ganancias por Mes</h5>
          </div>
          <div class="card-body">
            <canvas id="graficoGananciasMes"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-award"></i> Producto Más Rentable</h5>
          </div>
          <div class="card-body">
            <h4>${datos.producto_mas_rentable.nombre}</h4>
            <p><strong>Ganancia Generada:</strong> $${parseFloat(datos.producto_mas_rentable.ganancia).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('contenedorReporte').innerHTML = html;
  
  // Crear gráfico de ganancias por mes
  setTimeout(() => {
    crearGraficoGananciasMes(datos.ganancias_mes);
  }, 100);
}

function crearGraficos(datos) {
  setTimeout(() => {
    crearGraficoVentasMes(datos.ventas_mes);
    crearGraficoProductosTop(datos.productos_top);
  }, 100);
}

function crearGraficoVentasMes(ventasMes) {
  const ctx = document.getElementById('graficoVentasMes');
  if (!ctx) return;

  if (graficoVentasMes) {
    graficoVentasMes.destroy();
  }

  const labels = Object.keys(ventasMes).reverse();
  const data = Object.values(ventasMes).reverse();

  graficoVentasMes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Número de Ventas',
          data: data,
          backgroundColor: '#d4a574',
          borderColor: '#4b2e18',
          borderWidth: 2,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: '#4b2e18',
            font: { size: 12 },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#4b2e18' },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        x: {
          ticks: { color: '#4b2e18' },
          grid: { display: false },
        },
      },
    },
  });
}

function crearGraficoProductosTop(productosTop) {
  const ctx = document.getElementById('graficoProductosTop');
  if (!ctx) return;

  if (graficoProductosTop) {
    graficoProductosTop.destroy();
  }

  const colores = [
    '#d4a574',
    '#a67b5b',
    '#6b4423',
    '#4b2e18',
    '#8b6f47',
    '#c99b7d',
    '#e8d5bb',
    '#b8956a',
    '#7a5c43',
    '#9d7e6f',
  ];

  graficoProductosTop = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: productosTop.map((p) => p.nombre),
      datasets: [
        {
          data: productosTop.map((p) => p.cantidad),
          backgroundColor: colores.slice(0, productosTop.length),
          borderColor: '#fff8ee',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#4b2e18',
            font: { size: 11 },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ': ' + context.parsed + ' unidades';
            },
          },
        },
      },
    },
  });
}

function crearGraficoGananciasMes(gananciasMes) {
  const ctx = document.getElementById('graficoGananciasMes');
  if (!ctx) return;

  const labels = Object.keys(gananciasMes).reverse();
  const data = labels.map(l => parseFloat(gananciasMes[l])).reverse();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ganancias por Mes',
          data: data,
          borderColor: '#6b4423',
          backgroundColor: 'rgba(212, 165, 116, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: '#4b2e18',
            font: { size: 12 },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#4b2e18' },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        x: {
          ticks: { color: '#4b2e18' },
          grid: { display: false },
        },
      },
    },
  });
}

function cargarUltimasVentas() {
  fetch('/ventas/listar/')
    .then((res) => res.json())
    .then((datos) => {
      const tbody = document.getElementById('tablaUltimasVentas');
      if (!tbody) return;

      if (datos.length === 0) {
        tbody.innerHTML =
          '<tr class="text-center text-muted"><td colspan="5">No hay ventas registradas</td></tr>';
        return;
      }

      let html = '';
      datos.slice(0, 10).forEach((venta) => {
        html += `
          <tr>
            <td>#${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>${venta.usuario}</td>
            <td><span class="badge bg-info">${venta.cantidad_items}</span></td>
            <td><strong>$${parseFloat(venta.total).toFixed(2)}</strong></td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    })
    .catch((err) => {
      console.error('Error:', err);
    });
}
