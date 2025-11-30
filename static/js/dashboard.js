// Dashboard - Gráficas con Chart.js

document.addEventListener('DOMContentLoaded', function() {
    // Gráfica de líneas - Ventas últimos 6 meses
    const ctx1 = document.getElementById('grafica1');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ventas',
                    data: [12, 19, 9, 22, 30, 27],
                    borderColor: '#7a5c43',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    // Gráfica circular - Inventario
    const ctx2 = document.getElementById('grafica2');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Vendido'],
                datasets: [{
                    data: [68, 32],
                    backgroundColor: ['#52330d', '#f9dab9']
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }
});
