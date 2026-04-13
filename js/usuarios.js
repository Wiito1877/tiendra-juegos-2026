(function () {
    const AUTH_KEY = "tienda_admin_auth";
    const STORAGE_USERS_KEY = "tienda_usuarios_2026";
    const HISTORIAL_VENTAS_KEY = "tienda_ventas_historial_2026";

    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const form = document.getElementById("form-usuario");
    const lista = document.getElementById("usuarios-lista");
    const vacio = document.getElementById("usuarios-vacio");
    const btnLogout = document.getElementById("btn-logout-usuarios");

    if (!form || !lista || !vacio || !btnLogout) {
        return;
    }

    function leerUsuarios() {
        try {
            const raw = localStorage.getItem(STORAGE_USERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function guardarUsuarios(usuarios) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
    }

    function leerHistorialVentas() {
        try {
            const raw = localStorage.getItem(HISTORIAL_VENTAS_KEY);
            const historial = raw ? JSON.parse(raw) : [];
            return Array.isArray(historial) ? historial : [];
        } catch (error) {
            return [];
        }
    }

    function guardarHistorialVentas(historial) {
        localStorage.setItem(HISTORIAL_VENTAS_KEY, JSON.stringify(historial));
    }

    function marcarVentasDeVendedorEliminado(nombreUsuario) {
        if (!nombreUsuario) return;

        const historial = leerHistorialVentas();
        let huboCambios = false;

        historial.forEach(function (venta) {
            if (String(venta.vendedor) === String(nombreUsuario)) {
                venta.vendedor = "vendedor (eliminado)";
                huboCambios = true;
            }
        });

        if (huboCambios) {
            guardarHistorialVentas(historial);
        }
    }

    function existeUsuario(nombre) {
        const usuarios = leerUsuarios();
        return usuarios.some(function (u) {
            return String(u.usuario).toLowerCase() === String(nombre).toLowerCase();
        });
    }

    function render() {
        const usuarios = leerUsuarios();
        lista.innerHTML = "";
        vacio.style.display = usuarios.length === 0 ? "block" : "none";

        usuarios.forEach(function (usuario) {
            const card = document.createElement("div");
            card.className = "usuario-card";

            const nombre = document.createElement("h3");
            nombre.textContent = usuario.usuario;

            const rol = document.createElement("p");
            rol.textContent = "Privilegio: " + usuario.rol;

            const meta = document.createElement("p");
            meta.textContent = "Creado: " + new Date(usuario.creadoEn).toLocaleString("es-CL");

            const eliminar = document.createElement("button");
            eliminar.type = "button";
            eliminar.className = "btn-eliminar";
            eliminar.textContent = "Eliminar";
            eliminar.addEventListener("click", function () {
                if (String(usuario.rol || "").toLowerCase() === "ventas") {
                    marcarVentasDeVendedorEliminado(usuario.usuario);
                }

                const actual = leerUsuarios();
                const filtrados = actual.filter(function (u) {
                    return u.id !== usuario.id;
                });
                guardarUsuarios(filtrados);
                render();
            });

            card.appendChild(nombre);
            card.appendChild(rol);
            card.appendChild(meta);
            card.appendChild(eliminar);
            lista.appendChild(card);
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = form.usuario.value.trim();
        const clave = form.clave.value;
        const rol = form.rol.value;

        if (!nombre || !clave || !rol) {
            return;
        }

        if (existeUsuario(nombre)) {
            alert("Ese usuario ya existe.");
            return;
        }

        const usuarios = leerUsuarios();
        usuarios.push({
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            usuario: nombre,
            clave: clave,
            rol: rol,
            creadoEn: Date.now()
        });

        guardarUsuarios(usuarios);
        form.reset();
        render();
    });

    btnLogout.addEventListener("click", function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "tienda.html";
    });

    render();
})();
