// Sistema de Ventas Flotante
const AUTH_VENDEDOR_KEY = "tienda_vendedor_auth";
const AUTH_ADMIN_KEY = "tienda_admin_auth";
const USUARIOS_KEY = "tienda_usuarios_2026";
const CARRITO_KEY = "tienda_carrito_2026";
const VENTAS_CARRITOS_KEY = "tienda_ventas_carritos_2026";
const VENTA_ACTIVA_KEY = "tienda_ventas_activa_2026";
const VENTAS_HISTORIAL_KEY = "tienda_ventas_historial_2026";
const VENTAS_CORRELATIVO_KEY = "tienda_ventas_correlativo_2026";
const PRODUCTOS_KEY = "tienda_juegos_2026";
const HOME_PRIMERA_APERTURA_KEY = "tienda_home_primer_inicio";
let autoSyncTimer = null;

function leerHistorialVentas() {
    try {
        const raw = localStorage.getItem(VENTAS_HISTORIAL_KEY);
        const historial = raw ? JSON.parse(raw) : [];
        return Array.isArray(historial) ? historial : [];
    } catch (e) {
        return [];
    }
}

function guardarHistorialVentas(historial) {
    localStorage.setItem(VENTAS_HISTORIAL_KEY, JSON.stringify(historial));
}

function obtenerCorrelativoActual() {
    return Number(localStorage.getItem(VENTAS_CORRELATIVO_KEY) || 0);
}

function fijarCorrelativoActual(valor) {
    localStorage.setItem(VENTAS_CORRELATIVO_KEY, String(Number(valor) || 0));
}

function obtenerSiguienteCorrelativoVenta() {
    let actual = obtenerCorrelativoActual();

    if (actual <= 0) {
        const historial = leerHistorialVentas();
        actual = historial.reduce((maximo, venta) => {
            const numero = Number(venta.correlativo || venta.idVenta || 0);
            if (Number.isFinite(numero) && numero > maximo) {
                return numero;
            }
            return maximo;
        }, 0);
    }

    const siguiente = actual + 1;
    fijarCorrelativoActual(siguiente);
    return siguiente;
}

function generarIdVenta() {
    return "venta_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function leerCarritosVentas() {
    try {
        const raw = localStorage.getItem(VENTAS_CARRITOS_KEY);
        const carritos = raw ? JSON.parse(raw) : [];
        return Array.isArray(carritos) ? carritos : [];
    } catch (e) {
        return [];
    }
}

function guardarCarritosVentas(carritos) {
    localStorage.setItem(VENTAS_CARRITOS_KEY, JSON.stringify(carritos));
}

function leerCarritoPrincipal() {
    try {
        const raw = localStorage.getItem(CARRITO_KEY);
        const carrito = raw ? JSON.parse(raw) : [];
        return Array.isArray(carrito) ? carrito : [];
    } catch (e) {
        return [];
    }
}

function guardarCarritoPrincipal(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
}

function obtenerVentaActivaId() {
    return localStorage.getItem(VENTA_ACTIVA_KEY);
}

function fijarVentaActivaId(id) {
    localStorage.setItem(VENTA_ACTIVA_KEY, id);
}

function crearNuevaVenta(nombreCliente) {
    const carritos = leerCarritosVentas();
    const nombre = (nombreCliente || "Cliente 1").trim();

    const unica = carritos.length
        ? carritos[0]
        : {
            id: generarIdVenta(),
            cliente: nombre,
            items: [],
            creadaEn: Date.now()
        };

    unica.cliente = nombre || "Cliente 1";
    unica.items = [];
    unica.creadaEn = Date.now();

    guardarCarritosVentas([unica]);
    fijarVentaActivaId(unica.id);
    guardarCarritoPrincipal([]);
    return unica;
}

function obtenerVentaActiva(carritos) {
    if (!carritos.length) return null;

    const activaId = obtenerVentaActivaId();
    const activa = carritos.find((c) => c.id === activaId);
    if (activa) return activa;

    fijarVentaActivaId(carritos[0].id);
    return carritos[0];
}

function asegurarVentasIniciales() {
    let carritos = leerCarritosVentas();

    if (!carritos.length) {
        const carritoInicial = leerCarritoPrincipal();
        carritos = [{
            id: generarIdVenta(),
            cliente: "Cliente 1",
            items: carritoInicial,
            creadaEn: Date.now()
        }];
        guardarCarritosVentas(carritos);
        fijarVentaActivaId(carritos[0].id);
    } else if (carritos.length > 1) {
        // Venta unica: conservar solo la primera para evitar paralelos.
        carritos = [carritos[0]];
        guardarCarritosVentas(carritos);
        fijarVentaActivaId(carritos[0].id);
    }

    const activa = obtenerVentaActiva(carritos);
    if (activa) {
        guardarCarritoPrincipal(activa.items || []);
    }
}

function sincronizarVentaActivaDesdeCarritoPrincipal() {
    const carritos = leerCarritosVentas();
    const activa = obtenerVentaActiva(carritos);
    if (!activa) return;

    const carritoPrincipal = leerCarritoPrincipal();
    const actual = JSON.stringify(activa.items || []);
    const nuevo = JSON.stringify(carritoPrincipal);

    if (actual !== nuevo) {
        activa.items = carritoPrincipal;
        guardarCarritosVentas(carritos);
    }
}

function cambiarVentaActiva(idVenta) {
    const carritos = leerCarritosVentas();
    const destino = carritos.find((c) => c.id === idVenta);
    if (!destino) return;

    sincronizarVentaActivaDesdeCarritoPrincipal();
    fijarVentaActivaId(idVenta);
    guardarCarritoPrincipal(destino.items || []);
}

function obtenerSesionVentas() {
    const raw = localStorage.getItem(AUTH_VENDEDOR_KEY);
    if (!raw) return null;

    try {
        const sesion = JSON.parse(raw);
        if (!sesion || !sesion.usuario) return null;

        const rolNormalizado = String(sesion.rol || "").toLowerCase();
        const esVentas = sesion.esVentas === true || rolNormalizado === "ventas";

        return esVentas ? sesion : null;
    } catch (e) {
        return null;
    }
}

function abrirHomePorDefectoPrimeraVez() {
    const yaInicio = localStorage.getItem(HOME_PRIMERA_APERTURA_KEY);
    const path = window.location.pathname.replace(/\\/g, '/');
    const esHome = path.endsWith('/index.html') || path.endsWith('/Semana_03/');

    if (!yaInicio) {
        localStorage.setItem(HOME_PRIMERA_APERTURA_KEY, 'ok');
        if (!esHome) {
            const destino = path.includes('/htmls/') ? '../index.html' : 'index.html';
            window.location.href = destino;
        }
    }
}

// Inicializar el sistema de ventas
function inicializarSistemaVentas() {
    abrirHomePorDefectoPrimeraVez();
    asegurarVentasIniciales();
    agregarBotoVentas();
    crearModalCarrito();
    crearCarritoFlotante();
    verificarAutenticacionVendedor();
}

// Agregar botón Ventas
function agregarBotoVentas() {
    const header = document.querySelector('header');
    if (!header) return;

    const btnVentas = document.createElement('button');
    btnVentas.id = 'btn-ventas-header';
    btnVentas.className = 'ventas-mini';
    btnVentas.innerHTML = '💰 Ventas';
    
    btnVentas.addEventListener('click', () => {
        const sesion = obtenerSesionVentas();
        if (sesion) {
            mostrarCarritoFlotante();
        } else {
            abrirModalLogin();
        }
    });

    header.appendChild(btnVentas);
}

function actualizarBotonVentas(nombreUsuario = null) {
    const btnVentas = document.getElementById('btn-ventas-header');
    if (!btnVentas) return;

    btnVentas.innerHTML = nombreUsuario ? `💰 ${nombreUsuario}` : '💰 Ventas';
}

function actualizarVisibilidadEnlacesCarritoVenta(autenticado) {
    const selectores = [
        'a[href="carrito-venta.html"]',
        'a[href="htmls/carrito-venta.html"]',
        'a[href="../htmls/carrito-venta.html"]'
    ];

    document.querySelectorAll(selectores.join(', ')).forEach((link) => {
        const contenedor = link.closest('li') || link;
        contenedor.style.display = autenticado ? '' : 'none';
    });

    actualizarNavegacionSesionVentas(autenticado);
}

function actualizarNavegacionSesionVentas(autenticado) {
    const path = window.location.pathname.replace(/\\/g, '/');
    const esHome = path.endsWith('/index.html') || path.endsWith('/Semana_03/');
    const enlaces = document.querySelectorAll('nav ul li a');

    enlaces.forEach((link) => {
        const li = link.closest('li') || link;
        const href = (link.getAttribute('href') || '').trim();
        const esCatalogo = href === 'catalogo.html' || href === 'htmls/catalogo.html';
        const esCarrito = href === 'carrito-venta.html' || href === 'htmls/carrito-venta.html';
        const esHomeLink = href === '#' || href === 'index.html' || href === '../index.html';

        if (autenticado) {
            li.style.display = (esCatalogo || esCarrito) ? '' : 'none';
            return;
        }

        if (esCarrito) {
            li.style.display = 'none';
            return;
        }

        if (esHome && esHomeLink) {
            li.style.display = 'none';
            return;
        }

        li.style.display = '';
    });

    asegurarBotonCerrarSesionNav(autenticado);
}

function asegurarBotonCerrarSesionNav(autenticado) {
    const navUl = document.querySelector('nav ul');
    if (!navUl) return;

    let itemLogout = document.getElementById('nav-logout-ventas-item');
    if (!itemLogout) {
        itemLogout = document.createElement('li');
        itemLogout.id = 'nav-logout-ventas-item';

        const linkLogout = document.createElement('a');
        linkLogout.href = '#';
        linkLogout.id = 'nav-logout-ventas-link';
        linkLogout.textContent = 'Cerrar sesion';
        linkLogout.addEventListener('click', function (e) {
            e.preventDefault();
            desloguearVendedor();
        });

        itemLogout.appendChild(linkLogout);
        navUl.appendChild(itemLogout);
    }

    itemLogout.style.display = autenticado ? '' : 'none';
}

function notificarCambioAuthVentas() {
    window.dispatchEvent(new Event('ventas-auth-change'));

    if (typeof window.aplicarTemaSesionGlobal === 'function') {
        window.aplicarTemaSesionGlobal();
    }
}

function redirigirTrasLogoutVentas() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const enCarpetaHtmls = path.includes('/htmls/');
    const destino = enCarpetaHtmls ? '../index.html' : 'index.html';
    window.location.href = destino;
}

function redirigirACarritoVenta() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const enCarpetaHtmls = path.includes('/htmls/');
    const destino = enCarpetaHtmls ? 'carrito-venta.html' : 'htmls/carrito-venta.html';

    if (path.endsWith('/carrito-venta.html')) {
        window.location.reload();
        return;
    }

    window.location.href = destino;
}

// Crear modal de login
function crearModalCarrito() {
    const modal = document.createElement('div');
    modal.id = 'modal-carrito-vendedor';
    modal.className = 'modal-carrito-ventas';
    modal.innerHTML = `
        <div class="modal-carrito-content">
            <h2>🛒 Login Vendedor</h2>
            <p class="nota" style="margin-bottom: 15px; text-align: center;">Ingresa para acceder al carrito de ventas</p>
            
            <input type="text" id="vendedor-user-login" placeholder="Usuario" />
            <input type="password" id="vendedor-pass-login" placeholder="Contraseña" />
            
            <p id="modal-carrito-error" class="modal-error" style="display: none;"></p>
            <p id="modal-carrito-success" class="modal-success" style="display: none;"></p>
            
            <div class="modal-carrito-actions">
                <button class="btn-modal-login" id="btn-login-vendedor">Ingresar</button>
                <button class="btn-modal-cerrar" id="btn-cerrar-modal">Cerrar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btn-login-vendedor').addEventListener('click', loginVendedor);
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModalLogin);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalLogin();
    });
}

// Abrir modal de login
function abrirModalLogin() {
    const modal = document.getElementById('modal-carrito-vendedor');
    modal.classList.add('visible');
    document.getElementById('vendedor-user-login').focus();
}

// Cerrar modal de login
function cerrarModalLogin() {
    const modal = document.getElementById('modal-carrito-vendedor');
    modal.classList.remove('visible');
    document.getElementById('vendedor-user-login').value = '';
    document.getElementById('vendedor-pass-login').value = '';
    document.getElementById('modal-carrito-error').style.display = 'none';
    document.getElementById('modal-carrito-success').style.display = 'none';
}

// Login de vendedor
function loginVendedor() {
    const usuario = document.getElementById('vendedor-user-login').value.trim();
    const clave = document.getElementById('vendedor-pass-login').value;
    const errorDiv = document.getElementById('modal-carrito-error');
    const successDiv = document.getElementById('modal-carrito-success');

    if (localStorage.getItem(AUTH_ADMIN_KEY) === 'ok') {
        errorDiv.textContent = '✗ Ya existe una sesión de administrador activa';
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        return;
    }

    if (!usuario || !clave) {
        errorDiv.textContent = '⚠ Usuario y contraseña son requeridos';
        errorDiv.style.display = 'block';
        return;
    }

    // Obtener usuarios
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY) || '[]');

    // Buscar usuario con rol Ventas
    const usuarioEncontrado = usuarios.find(u => 
        u.usuario === usuario && u.clave === clave && u.rol === "Ventas"
    );

    if (usuarioEncontrado) {
        // Autenticar
        localStorage.setItem(AUTH_VENDEDOR_KEY, JSON.stringify({
            usuario: usuarioEncontrado.usuario,
            rol: usuarioEncontrado.rol,
            esVentas: true
        }));

        actualizarBotonVentas(usuarioEncontrado.usuario);
        actualizarVisibilidadEnlacesCarritoVenta(true);
        notificarCambioAuthVentas();

        successDiv.textContent = `✓ Bienvenido ${usuario}`;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';

        setTimeout(() => {
            redirigirACarritoVenta();
        }, 350);
    } else {
        errorDiv.textContent = '✗ Usuario/contraseña inválidos o no eres vendedor';
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        document.getElementById('vendedor-pass-login').value = '';
    }
}

// Crear carrito flotante
function crearCarritoFlotante() {
    const carrito = document.createElement('div');
    carrito.id = 'carrito-flotante';
    carrito.className = 'carrito-flotante-container';
    carrito.innerHTML = `
        <div class="carrito-flotante-header">
            🛒 Carrito de Ventas
            <span class="btn-ventas-close" style="float: right; cursor: pointer; font-size: 18px;" onclick="cerrarCarritoFlotante()">×</span>
        </div>
        <div id="carrito-flotante-contenido">
            <!-- Se llenará dinámicamente -->
        </div>
        <button id="btn-procesar-venta" class="btn-inacap btn-block" style="margin-top: 10px;">
            💰 Procesar Venta
        </button>
        <button id="btn-cerrar-sesion-vendedor" class="btn-eliminar btn-block" style="margin-top: 12px;">
            Cerrar sesión de ventas
        </button>
    `;

    document.body.appendChild(carrito);

    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion-vendedor');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', desloguearVendedor);
    }

    const btnProcesarVenta = document.getElementById('btn-procesar-venta');
    if (btnProcesarVenta) {
        btnProcesarVenta.addEventListener('click', procesarVentaActiva);
    }
}

// Mostrar carrito flotante
function mostrarCarritoFlotante() {
    const carrito = document.getElementById('carrito-flotante');
    carrito.classList.add('visible');
    actualizarCarritoFlotante();

    if (!autoSyncTimer) {
        autoSyncTimer = setInterval(() => {
            const visible = document.getElementById('carrito-flotante')?.classList.contains('visible');
            if (!visible) return;
            actualizarCarritoFlotante();
        }, 1200);
    }
}

// Cerrar carrito flotante
function cerrarCarritoFlotante() {
    const carrito = document.getElementById('carrito-flotante');
    carrito.classList.remove('visible');

    if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
    }
}

// Actualizar carrito flotante
function actualizarCarritoFlotante() {
    const contenido = document.getElementById('carrito-flotante-contenido');
    if (!contenido) return;

    sincronizarVentaActivaDesdeCarritoPrincipal();

    const carritos = leerCarritosVentas();
    const ventaActiva = obtenerVentaActiva(carritos);
    const carrito = ventaActiva ? (ventaActiva.items || []) : [];

    if (!Array.isArray(carrito) || carrito.length === 0) {
        contenido.innerHTML = '<p class="nota" style="text-align: center;">📦 Carrito vacío para este cliente</p>';
        return;
    }

    let html = '<div style="max-height: 350px; overflow-y: auto;">';
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        html += `
            <div class="carrito-fila">
                <div class="carrito-fila-nombre">${item.nombre}</div>
                <div class="carrito-fila-meta">Cantidad: ${item.cantidad} × $${item.precio}</div>
                <div class="carrito-fila-subtotal">Subtotal: $${subtotal.toLocaleString()}</div>
            </div>
        `;
    });

    html += '</div>';
    html += `<div class="carrito-resumen-total">Total Carrito: $${total.toLocaleString()}</div>`;

    contenido.innerHTML = html;
}

function cerrarVentaActiva() {
    const carritos = leerCarritosVentas();
    const activa = obtenerVentaActiva(carritos);
    if (!activa) return;

    const confirmar = confirm(`¿Cerrar venta de ${activa.cliente}?`);
    if (!confirmar) return;

    activa.items = [];
    guardarCarritosVentas([activa]);
    fijarVentaActivaId(activa.id);
    guardarCarritoPrincipal([]);
    actualizarCarritoFlotante();
    notificarCambioAuthVentas();
}

function procesarVentaActiva() {
    sincronizarVentaActivaDesdeCarritoPrincipal();

    const carritos = leerCarritosVentas();
    const activa = obtenerVentaActiva(carritos);
    if (!activa) return;

    const sesion = obtenerSesionVentas();
    if (!sesion) {
        alert('Tu sesión de ventas expiró. Inicia sesión nuevamente.');
        return;
    }

    const items = Array.isArray(activa.items) ? activa.items : [];
    if (!items.length) {
        alert('No hay productos en la venta activa.');
        return;
    }

    const total = items.reduce((acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 0), 0);

    const detalleItems = items.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        plataforma: item.plataforma,
        precioUnitario: Number(item.precio || 0),
        cantidad: Number(item.cantidad || 0),
        subtotal: Number(item.precio || 0) * Number(item.cantidad || 0)
    }));

    const historial = leerHistorialVentas();
    const correlativo = obtenerSiguienteCorrelativoVenta();
    historial.push({
        idVenta: correlativo,
        correlativo: correlativo,
        cliente: activa.cliente,
        vendedor: sesion.usuario,
        fecha: Date.now(),
        total: total,
        items: detalleItems
    });
    guardarHistorialVentas(historial);

    activa.items = [];
    guardarCarritosVentas([activa]);
    fijarVentaActivaId(activa.id);
    guardarCarritoPrincipal([]);

    alert(`Venta finalizada y cerrada para ${activa.cliente}. Total: $${total.toLocaleString()}`);

    actualizarCarritoFlotante();
    notificarCambioAuthVentas();
}

// Verificar autenticación al cargar
function verificarAutenticacionVendedor() {
    const sesion = obtenerSesionVentas();
    if (sesion) {
        actualizarBotonVentas(sesion.usuario);
        actualizarVisibilidadEnlacesCarritoVenta(true);
    } else {
        actualizarVisibilidadEnlacesCarritoVenta(false);
        actualizarBotonVentas();
    }

    if (typeof window.aplicarTemaSesionGlobal === 'function') {
        window.aplicarTemaSesionGlobal();
    }
}

// Desloguear vendedor
function desloguearVendedor() {
    sincronizarVentaActivaDesdeCarritoPrincipal();
    localStorage.removeItem(AUTH_VENDEDOR_KEY);
    cerrarCarritoFlotante();
    actualizarBotonVentas();
    actualizarVisibilidadEnlacesCarritoVenta(false);
    notificarCambioAuthVentas();
    redirigirTrasLogoutVentas();
}

// Ejecutar al cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSistemaVentas);
} else {
    inicializarSistemaVentas();
}
