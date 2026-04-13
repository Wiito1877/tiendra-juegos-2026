(function () {
    const formLogin = document.getElementById("form-login-admin");
    const estadoAdmin = document.getElementById("estado-admin");
    const linkPanel = document.getElementById("link-panel-admin");

    const AUTH_KEY = "tienda_admin_auth";
    const AUTH_VENDEDOR_KEY = "tienda_vendedor_auth";
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "1234";

    function estaAutenticado() {
        return localStorage.getItem(AUTH_KEY) === "ok";
    }

    function actualizarVistaAdmin() {
        const auth = estaAutenticado();
        estadoAdmin.textContent = auth
            ? "Estado: autenticado como administrador"
            : "Estado: no autenticado";
        linkPanel.classList.toggle("hidden", !auth);

        if (auth) {
            window.location.href = "admin-catalogo.html";
        }
    }

    formLogin.addEventListener("submit", function (event) {
        event.preventDefault();

        const usuario = formLogin.usuario.value.trim();
        const clave = formLogin.clave.value;

        if (localStorage.getItem(AUTH_VENDEDOR_KEY)) {
            alert("Ya hay una sesión de vendedor activa. Cierra la sesión de ventas antes de ingresar como administrador.");
            return;
        }

        if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
            localStorage.setItem(AUTH_KEY, "ok");
            formLogin.reset();
            window.location.href = "admin-catalogo.html";
            return;
        }

        alert("Credenciales incorrectas. Usa usuario admin y clave 1234.");
    });

    actualizarVistaAdmin();
})();
