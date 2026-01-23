// Dashboard - Gráficas con Chart.js

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del dashboard
    fetch('/inicio/datos/')
        .then(res => res.json())
        .then(datos => {
            console.log("Datos del dashboard:", datos);
            crearGraficas(datos);
        })
        .catch(err => console.error("Error al cargar datos:", err));
    
    function crearGraficas(datos) {
        // Gráfica de líneas - Ventas últimos 6 meses
        const ctx1 = document.getElementById('grafica1');
        if (ctx1) {
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: datos.meses || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Ventas',
                        data: datos.ventas_ultimos_6_meses || [0, 0, 0, 0, 0, 0],
                        borderColor: '#7a5c43',
                        backgroundColor: 'rgba(122, 92, 67, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { 
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: '#333'
                            }
                        }
                    }
                }
            });
        }

        // Gráfica circular - Inventario por proveedor
        const ctx2 = document.getElementById('grafica2');
        if (ctx2) {
            // Generar colores para cada proveedor
            const colores = [
                '#4b2e18',
                '#6b4423',
                '#d4a574',
                '#8b5a3c'
            ];
            
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: datos.labels_inventario || ['Bebidas', 'Dulces', 'Helados', 'Café'],
                    datasets: [{
                        data: datos.inventario_por_proveedor || [11, 29, 1, 5],
                        backgroundColor: colores,
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: { 
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
});
