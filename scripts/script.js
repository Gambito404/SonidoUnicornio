document.addEventListener('DOMContentLoaded', () => {
    // Las bases de datos `productosSonido` y `productosTarimas` ahora se cargan desde archivos separados.

    // Unimos ambos objetos para facilitar la búsqueda de productos por ID
    const todosLosProductos = { ...productosSonido, ...productosTarimas };

    // --- ESTADO DE LA APLICACIÓN (Cargado desde localStorage) ---
    let carrito = JSON.parse(localStorage.getItem('sonidoUnicornioCart')) || [];
    let productoActualId = null;

    // --- SELECCIÓN DE ELEMENTOS DEL DOM (Solo si existen en la página actual) ---
    const modalDetalles = document.getElementById('modal-detalles');
    const modalCarrito = document.getElementById('modal-carrito');
    const modalAlerta = document.getElementById('modal-alerta');
    const cerrarModales = document.querySelectorAll('.cerrar-modal');
    const botonesDetalles = document.querySelectorAll('.btn-detalles');
    const btnAnadirCarrito = document.getElementById('btn-anadir-carrito');
    const carritoBurbuja = document.getElementById('carrito-burbuja');
    const carritoContador = document.getElementById('carrito-contador');
    const carritoItemsContainer = document.getElementById('carrito-items');
    const carritoTotalEl = document.getElementById('carrito-total');
    const btnFinalizarPedido = document.getElementById('btn-finalizar-pedido');
    const fechaEventoInput = document.getElementById('fecha-evento');
    const horaEventoInput = document.getElementById('hora-evento');
    const alertaMensaje = document.getElementById('alerta-mensaje');
    const btnCerrarAlerta = document.getElementById('btn-cerrar-alerta');

    // --- LÓGICA DE MODALES (Sin cambios, solo reordenado) ---
    function abrirModal(modal) { if (modal) modal.style.display = 'flex'; }
    function cerrarModalesFunc() {
        if (modalDetalles) modalDetalles.style.display = 'none';
        if (modalCarrito) modalCarrito.style.display = 'none';
        if (modalAlerta) modalAlerta.style.display = 'none';
    }

    // Nueva función para mostrar alertas personalizadas
    function mostrarAlerta(mensaje) {
        if (alertaMensaje && modalAlerta) {
            alertaMensaje.textContent = mensaje;
            abrirModal(modalAlerta);
        }
    }

    if (cerrarModales.length > 0) {
        cerrarModales.forEach(btn => btn.addEventListener('click', cerrarModalesFunc));
        if (btnCerrarAlerta) btnCerrarAlerta.addEventListener('click', cerrarModalesFunc);
        window.addEventListener('click', (e) => { 
            if (e.target === modalDetalles || e.target === modalCarrito) {
                cerrarModalesFunc();
            }
        });
    }

    // --- LÓGICA DE FECHA ---
    function configurarFechaHoraActual() {
        if (!fechaEventoInput || !horaEventoInput) return;

        const ahora = new Date();
        // Ajuste para la zona horaria local para que la fecha y hora sean correctas
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());

        const fechaActual = ahora.toISOString().split('T')[0];
        const horaActual = ahora.toISOString().split('T')[1].substring(0, 5);

        // Establecer el valor y el mínimo inicial
        fechaEventoInput.min = fechaActual;
        fechaEventoInput.value = fechaActual;
        horaEventoInput.min = horaActual;
        horaEventoInput.value = horaActual;

        // Función para manejar el cambio de fecha
        const handleDateChange = () => {
            const fechaSeleccionada = fechaEventoInput.value;
            
            if (fechaSeleccionada === fechaActual) {
                // Si se selecciona hoy, la hora mínima es la actual
                horaEventoInput.min = horaActual;
                // Si la hora seleccionada es anterior a la mínima, la reseteamos
                if (horaEventoInput.value < horaActual) {
                    horaEventoInput.value = horaActual;
                }
            } else {
                // Si es un día futuro, no hay hora mínima
                horaEventoInput.min = '';
            }
        };

        // Asignar el listener para reaccionar a los cambios
        fechaEventoInput.addEventListener('change', handleDateChange);
    }
    // --- LÓGICA DE RENDERIZADO DINÁMICO DE PRODUCTOS ---
    function renderizarProductos() {
        const catalogoGrid = document.querySelector('.catalogo-grid');
        if (!catalogoGrid) return; // Salir si no estamos en una página de catálogo

        // Determinar qué categoría de productos mostrar basándose en el título de la página
        const esPaginaTarimas = document.title.includes('Tarimas');
        const productosAMostrar = esPaginaTarimas ? productosTarimas : productosSonido;

        // Limpiar el grid actual
        catalogoGrid.innerHTML = '';

        // Crear las tarjetas de producto desde el objeto correspondiente
        Object.entries(productosAMostrar).forEach(([id, producto]) => {
            const cardHTML = `
                    <div class="card-producto" data-id="${id}">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                        <h3>${producto.nombre}</h3>
                        <p>${producto.descripcion}</p>
                        <button class="btn-detalles">Ver detalles</button>
                    </div>
                `;
            catalogoGrid.innerHTML += cardHTML;
        });

        // Volver a asignar los event listeners a los nuevos botones de "Ver detalles"
        asignarEventListenersDetalles();

        // Aplicar animación de entrada escalonada
        const cards = document.querySelectorAll('.card-producto');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100); // 100ms de retraso entre cada tarjeta
        });
    }

    function mostrarDetallesProducto(idProducto) {
        productoActualId = idProducto;
        const producto = todosLosProductos[productoActualId];

        if (!producto || !modalDetalles) return;

        // Rellenar datos básicos del modal
        document.getElementById('modal-img').src = producto.imagen;
        document.getElementById('modal-titulo').textContent = producto.nombre;
        document.getElementById('modal-descripcion').textContent = producto.descripcion;
        document.getElementById('modal-precio').textContent = `Precio: ${producto.precio.toFixed(2)} Bs.`;

        // Lógica para opciones
        const opcionesContainer = document.getElementById('modal-opciones');
        opcionesContainer.innerHTML = '';
        opcionesContainer.style.display = 'none';

        if (producto.type === 'tarima' && producto.alturas) {
            opcionesContainer.innerHTML = '<h4>Selecciona la altura:</h4>';
            const opcionesHTML = producto.alturas.map((altura, index) => `
                <div class="opcion-radio">
                    <input type="radio" id="altura-${index}" name="altura_tarima" value="${altura}" ${index === 0 ? 'checked' : ''}>
                    <label for="altura-${index}">${altura}</label>
                </div>
            `).join('');
            opcionesContainer.innerHTML += `<div class="opciones-wrapper">${opcionesHTML}</div>`;
            opcionesContainer.style.display = 'block';
        } else if (producto.type === 'sonido' && producto.componentes) {
            opcionesContainer.innerHTML = '<h4>Este paquete incluye:</h4>';
            opcionesContainer.innerHTML += `<ul class="lista-componentes">${producto.componentes.map(item => `<li>${item}</li>`).join('')}</ul>`;
            opcionesContainer.style.display = 'block';
        }

        abrirModal(modalDetalles);
    }

    function asignarEventListenersDetalles() {
        document.querySelectorAll('.btn-detalles').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const card = e.target.closest('.card-producto');
                mostrarDetallesProducto(card.dataset.id);
            });
        });
    }

    // --- LÓGICA DEL CARRITO ---
    function guardarCarrito() {
        localStorage.setItem('sonidoUnicornioCart', JSON.stringify(carrito));
    }

    function agregarAlCarrito() {
        if (productoActualId) {
            const productoBase = { ...todosLosProductos[productoActualId] };
            productoBase.id = productoActualId; // Guardamos el ID original para futuras referencias

            // Si es una tarima, añadir la altura seleccionada
            if (productoBase.type === 'tarima') {
                const alturaSeleccionada = document.querySelector('input[name="altura_tarima"]:checked').value;
                productoBase.altura = alturaSeleccionada;
                // Modificar el nombre para que se muestre en el carrito
                productoBase.nombre = `${productoBase.nombre} - Altura ${alturaSeleccionada}`;
            }

            carrito.push(productoBase);
            guardarCarrito();
            actualizarUICarrito();
            cerrarModalesFunc();
        }
    }

    function quitarDelCarrito(index) {
        carrito.splice(index, 1); // Elimina el elemento en la posición 'index'
        guardarCarrito();
        actualizarUICarrito();
    }

    function actualizarUICarrito() {
        if (!carritoBurbuja) return; // No hacer nada si no hay burbuja en la página

        carritoContador.textContent = carrito.length;
        
        if (carritoItemsContainer) {
            carritoItemsContainer.innerHTML = carrito.length === 0 ? '<p>Tu carrito está vacío.</p>' : '';
            if (carrito.length > 0) {
                // Usamos el índice para poder eliminar el producto correcto
                carrito.forEach((item, index) => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'carrito-item';
                    itemEl.innerHTML = `
                        <span class="carrito-item-nombre">${item.nombre}</span>
                        <div class="carrito-item-acciones">
                            <span>${item.precio.toFixed(2)} Bs.</span>
                            <button class="btn-info-item" data-id="${item.id}" title="Ver información del producto">&#8505;</button>
                            <button class="btn-quitar-item" data-index="${index}" title="Quitar del carrito">&times;</button>
                        </div>`;
                    carritoItemsContainer.appendChild(itemEl);
                });
            }
        }
        
        if (carritoTotalEl) {
            const total = carrito.reduce((sum, item) => sum + item.precio, 0);
            carritoTotalEl.textContent = `${total.toFixed(2)} Bs.`;
        }
    }

    // --- LÓGICA DE FINALIZAR PEDIDO ---
    let map;
    let marker;
    let mapInitialized = false;

    function inicializarMapa() {
        if (mapInitialized) {
            // Si el mapa ya se inicializó, solo nos aseguramos de que se vea bien.
            setTimeout(() => map.invalidateSize(), 100);
            return;
        };

        // Coordenadas personalizadas
        const centroCochabamba = [-17.4190751, -66.1547165]; 
        map = L.map('map').setView(centroCochabamba, 13); // Zoom más cercano para la ciudad

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        marker = L.marker(centroCochabamba, { draggable: true }).addTo(map);

        // Nueva funcionalidad: Mover el marcador al hacer clic en el mapa
        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
        });

        mapInitialized = true;

        // Leaflet a veces no se renderiza bien en un modal oculto, esto lo arregla.
        setTimeout(() => map.invalidateSize(), 100);
    }

    function finalizarPedido() {
        const fecha = document.getElementById('fecha-evento').value;
        const hora = document.getElementById('hora-evento').value;

        if (carrito.length === 0) {
            mostrarAlerta('Tu carrito está vacío. Añade productos antes de finalizar el pedido.');
            return;
        }
        if (!fecha || !hora) {
            mostrarAlerta('Por favor, selecciona la fecha y hora del evento.');
            return;
        }

        // Construir el mensaje
        let mensaje = `*¡Hola Sonido Unicornio!* 🦄\n\nQuisiera solicitar una cotización para los siguientes productos:\n\n`;

        carrito.forEach(item => {
            mensaje += `*- ${item.nombre}* (${item.precio.toFixed(2)} Bs.)\n`;
        });

        const total = carrito.reduce((sum, item) => sum + item.precio, 0);
        mensaje += `\n*Total Estimado:* ${total.toFixed(2)} Bs.\n`;
        mensaje += `\n*Detalles del Evento:*\n`;
        mensaje += `*Fecha:* ${fecha}\n`;
        mensaje += `*Hora:* ${hora}\n`;

        if (marker) {
            const { lat, lng } = marker.getLatLng();
            mensaje += `*Ubicación:* https://www.google.com/maps?q=${lat},${lng}\n`;
        }

        mensaje += `\n¡Espero su pronta respuesta!`;

        // Formatear para URL de WhatsApp
        const numeroBolivia = '59177424842';
        const urlWhatsApp = `https://wa.me/${numeroBolivia}?text=${encodeURIComponent(mensaje)}`;

        // Abrir en una nueva pestaña
        window.open(urlWhatsApp, '_blank');
    }


    if(btnAnadirCarrito) btnAnadirCarrito.addEventListener('click', agregarAlCarrito);
    if(carritoBurbuja) carritoBurbuja.addEventListener('click', () => {
        actualizarUICarrito();
        // Configurar la fecha y hora al momento actual cada vez que se abre el carrito
        configurarFechaHoraActual();
        abrirModal(modalCarrito);
        // Inicializar o refrescar el mapa cada vez que se abre el modal del carrito
        inicializarMapa();
    });
    if(btnFinalizarPedido) btnFinalizarPedido.addEventListener('click', finalizarPedido);

    // Event listener para los botones de quitar (usando delegación de eventos)
    if (carritoItemsContainer) {
        carritoItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-quitar-item')) {
                const index = parseInt(e.target.dataset.index, 10);
                quitarDelCarrito(index);
            }
            // Nuevo listener para el botón de información
            if (e.target.classList.contains('btn-info-item')) {
                const idProducto = e.target.dataset.id;
                cerrarModalesFunc(); // Cerramos el carrito
                setTimeout(() => mostrarDetallesProducto(idProducto), 150); // Mostramos los detalles directamente
            }
        });
    }

    // --- INICIALIZACIÓN ---
    // 1. Renderizar los productos dinámicamente si estamos en una página de catálogo
    renderizarProductos();
    // 2. Actualizar la UI del carrito en cuanto carga la página
    actualizarUICarrito();
});
