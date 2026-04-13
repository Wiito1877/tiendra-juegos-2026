(function () {
    const AUTH_KEY = "tienda_admin_auth";

    // Solo los administradores pueden acceder
    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const formAgregar = document.getElementById("form-agregar-juego");
    const inputNombreAgregar = document.getElementById("agregar-nombre");
    const checkboxesAgregar = document.querySelectorAll("input[name='agregar-plataformas']");
    const listaJuegos = document.getElementById("lista-juegos");
    const msgVacio = document.getElementById("msg-vacio");
    const btnLogoutGestion = document.getElementById("btn-logout-gestion");

    function render() {
        const catalogo = obtenerCatalogo();
        listaJuegos.innerHTML = "";
        msgVacio.style.display = catalogo.length === 0 ? "block" : "none";

        catalogo.forEach(function (juego) {
            const card = document.createElement("div");
            card.className = "juego-card";

            const titulo = document.createElement("h3");
            titulo.className = "juego-nombre";
            titulo.textContent = juego.nombre;

            const plataformas = document.createElement("p");
            plataformas.className = "juego-plataformas";
            plataformas.textContent = "Plataformas: " + juego.plataformas.join(", ");

            const btnEliminar = document.createElement("button");
            btnEliminar.type = "button";
            btnEliminar.className = "btn-eliminar";
            btnEliminar.textContent = "Eliminar";
            btnEliminar.addEventListener("click", function () {
                if (confirm("¿Eliminar '" + juego.nombre + "' del catálogo?")) {
                    if (eliminarJuegoDelCatalogo(juego.nombre)) {
                        render();
                    }
                }
            });

            card.appendChild(titulo);
            card.appendChild(plataformas);
            card.appendChild(btnEliminar);
            listaJuegos.appendChild(card);
        });
    }

    formAgregar.addEventListener("submit", function (e) {
        e.preventDefault();

        const nombre = inputNombreAgregar.value.trim();
        const plataformasSeleccionadas = Array.from(checkboxesAgregar)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (!nombre || plataformasSeleccionadas.length === 0) {
            alert("Por favor completa todos los campos");
            return;
        }

        if (agregarJuegoAlCatalogo(nombre, plataformasSeleccionadas)) {
            inputNombreAgregar.value = "";
            checkboxesAgregar.forEach(cb => cb.checked = false);
            render();
        } else {
            alert("El juego '" + nombre + "' ya existe en el catálogo");
        }
    });

    btnLogoutGestion.addEventListener("click", function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "tienda.html";
    });

    render();
})();
