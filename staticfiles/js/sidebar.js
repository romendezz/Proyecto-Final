// Interactividad mejorada de la barra lateral

document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.barra-lateral');
  const menuPrincipals = document.querySelectorAll('.menu-principal');

  // Toggle del menú en dispositivos móviles
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('show');
    });

    // Cerrar menú cuando se hace clic fuera
    document.addEventListener('click', function (event) {
      if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('show');
      }
    });
  }

  // Menús desplegables
  menuPrincipals.forEach((menu) => {
    const parent = menu.closest('.menu-group');

    // Expandir menú al hacer clic (solo si tiene parent menu-group)
    menu.addEventListener('click', function (e) {
      // Si no tiene parent, permitir navegación normal
      if (!parent) {
        return; // No hacer nada, dejar que el enlace funcione normalmente
      }
      
      e.preventDefault();
      parent.classList.toggle('active');

      // Cerrar otros menús
      document.querySelectorAll('.menu-group').forEach((group) => {
        if (group !== parent) {
          group.classList.remove('active');
        }
      });
    });

    // Si ya estamos en esa sección, expandir el menú
    if (menu.classList.contains('activo') && parent) {
      parent.classList.add('active');
    }
  });

  // Cerrar menú en mobile cuando se hace clic en un link
  document.querySelectorAll('.submenu a, .barra-lateral > a:not(.menu-principal)').forEach((link) => {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
      }
    });
  });

  // Ajustar comportamiento al cambiar tamaño de ventana
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('show');
    }
  });

  // Marcar enlace activo
  const currentPath = window.location.pathname;
  document.querySelectorAll('.barra-lateral a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace(/^\/|#.*/g, '').split('?')[0])) {
      link.classList.add('activo');
    }
  });
});
