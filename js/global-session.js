(function () {
    const AUTH_ADMIN_KEY = "tienda_admin_auth";
    const AUTH_VENDEDOR_KEY = "tienda_vendedor_auth";

    function normalizarPath(path) {
        return String(path || "").replace(/\\/g, "/");
    }

    function destinoHome() {
        const path = normalizarPath(window.location.pathname);
        return path.includes("/htmls/") ? "../index.html" : "index.html";
    }

    function limpiarSesiones() {
        localStorage.removeItem(AUTH_ADMIN_KEY);
        localStorage.removeItem(AUTH_VENDEDOR_KEY);
    }

    function obtenerSesionVendedor() {
        const raw = localStorage.getItem(AUTH_VENDEDOR_KEY);
        if (!raw) return null;

        try {
            const sesion = JSON.parse(raw);
            if (!sesion || !sesion.usuario) return null;
            const rol = String(sesion.rol || "").toLowerCase();
            const esVentas = sesion.esVentas === true || rol === "ventas";
            return esVentas ? sesion : null;
        } catch (error) {
            return null;
        }
    }

    function aplicarTemaSesionGlobal() {
        const body = document.body;
        if (!body) return;

        if (body.classList.contains("admin-theme")) {
            body.classList.remove("seller-theme");
            return;
        }

        const hayVendedor = !!obtenerSesionVendedor();
        body.classList.toggle("seller-theme", hayVendedor);
    }

    function configurarTituloLogout() {
        const titulo = document.querySelector("header h1");
        if (!titulo) return;

        titulo.classList.add("header-title-action");
        titulo.title = "Volver al inicio y cerrar sesión";

        titulo.addEventListener("click", function () {
            limpiarSesiones();
            window.location.href = destinoHome();
        });
    }

    window.aplicarTemaSesionGlobal = aplicarTemaSesionGlobal;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            configurarTituloLogout();
            aplicarTemaSesionGlobal();
        });
    } else {
        configurarTituloLogout();
        aplicarTemaSesionGlobal();
    }
})();
