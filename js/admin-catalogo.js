(function () {
    const AUTH_KEY = "tienda_admin_auth";
    const STORAGE_KEY = "tienda_juegos_2026";

    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const form = document.getElementById("form-admin-producto");
    const lista = document.getElementById("admin-lista");
    const vacio = document.getElementById("admin-vacio");
    const btnLogout = document.getElementById("btn-logout-admin");
    const selectNombre = document.getElementById("admin-nombre");
    const selectPlataforma = document.getElementById("admin-plataforma");

    let editandoId = null;

    function actualizarJuegosDisponibles() {
        const plataforma = selectPlataforma.value;
        selectNombre.innerHTML = '<option value="">Selecciona un juego</option>';

        if (!plataforma) {
            selectNombre.disabled = true;
            return;
        }

        const juegos = obtenerJuegosPorPlataforma(plataforma);
        juegos.forEach(function (juego) {
            const option = document.createElement("option");
            option.value = juego;
            option.textContent = juego;
            selectNombre.appendChild(option);
        });

        selectNombre.disabled = false;
    }

    function leerProductos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function guardarProductos(productos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    }

    function formatoCLP(valor) {
        return new Intl.NumberFormat("es-CL").format(valor);
    }

    function crearCampo(labelText, inputElement) {
        const wrapper = document.createElement("div");
        wrapper.className = "edicion-campo";
        const label = document.createElement("label");
        label.textContent = labelText;
        wrapper.appendChild(label);
        wrapper.appendChild(inputElement);
        return wrapper;
    }

    function render() {
        const productos = leerProductos();
        lista.innerHTML = "";
        vacio.style.display = productos.length === 0 ? "block" : "none";

        productos.forEach(function (producto, index) {
            const card = document.createElement("div");
            card.className = "producto-card";

            if (editandoId === producto.id) {
                card.className = "producto-card modo-edicion";

                const titulo = document.createElement("h3");
                titulo.textContent = "Editando producto";

                const nombreSelect = document.createElement("select");
                const opNombreVacia = document.createElement("option");
                opNombreVacia.value = "";
                opNombreVacia.textContent = "Selecciona un juego";
                nombreSelect.appendChild(opNombreVacia);

                const plataformaSelect = document.createElement("select");
                const opVacia = document.createElement("option");
                opVacia.value = "";
                opVacia.textContent = "Selecciona plataforma";
                const opPc = document.createElement("option");
                opPc.value = "PC";
                opPc.textContent = "PC";
                const opPs = document.createElement("option");
                opPs.value = "PS4-PS5";
                opPs.textContent = "PS4-PS5";
                plataformaSelect.appendChild(opVacia);
                plataformaSelect.appendChild(opPc);
                plataformaSelect.appendChild(opPs);
                plataformaSelect.value = producto.plataforma;

                // Actualizar juegos disponibles según plataforma en edit mode
                function actualizarJuegosEnEdicion() {
                    nombreSelect.innerHTML = '<option value="">Selecciona un juego</option>';
                    if (plataformaSelect.value) {
                        const juegos = obtenerJuegosPorPlataforma(plataformaSelect.value);
                        juegos.forEach(function (juego) {
                            const opt = document.createElement("option");
                            opt.value = juego;
                            opt.textContent = juego;
                            nombreSelect.appendChild(opt);
                        });
                    }
                    nombreSelect.value = producto.nombre;
                }

                actualizarJuegosEnEdicion();
                plataformaSelect.addEventListener("change", actualizarJuegosEnEdicion);

                const precioInput = document.createElement("input");
                precioInput.type = "number";
                precioInput.min = "0";
                precioInput.value = Number(producto.precio);

                const cantidadInput = document.createElement("input");
                cantidadInput.type = "number";
                cantidadInput.min = "1";
                cantidadInput.step = "1";
                cantidadInput.value = Number(producto.cantidad || 0);

                const gridEdicion = document.createElement("div");
                gridEdicion.className = "edicion-grid";
                gridEdicion.appendChild(crearCampo("Nombre:", nombreSelect));
                gridEdicion.appendChild(crearCampo("Plataforma:", plataformaSelect));
                gridEdicion.appendChild(crearCampo("Precio (CLP):", precioInput));
                gridEdicion.appendChild(crearCampo("Cantidad:", cantidadInput));

                const acciones = document.createElement("div");
                acciones.className = "acciones-admin";

                const btnGuardar = document.createElement("button");
                btnGuardar.type = "button";
                btnGuardar.className = "btn-editar";
                btnGuardar.textContent = "Guardar";
                btnGuardar.addEventListener("click", function () {
                    const nombre = nombreSelect.value.trim();
                    const plataforma = plataformaSelect.value;
                    const precio = Number(precioInput.value);
                    const cantidad = Number(cantidadInput.value);

                    if (!nombre || !plataforma || precio < 0 || !cantidad || cantidad <= 0) {
                        return;
                    }

                    const actual = leerProductos();
                    const item = actual.find(function (p) {
                        return p.id === producto.id;
                    });

                    if (item) {
                        item.nombre = nombre;
                        item.plataforma = plataforma;
                        item.precio = precio;
                        item.cantidad = cantidad;
                        guardarProductos(actual);
                    }

                    editandoId = null;
                    render();
                });

                const btnCancelar = document.createElement("button");
                btnCancelar.type = "button";
                btnCancelar.className = "btn-eliminar";
                btnCancelar.textContent = "Cancelar";
                btnCancelar.addEventListener("click", function () {
                    editandoId = null;
                    render();
                });

                acciones.appendChild(btnGuardar);
                acciones.appendChild(btnCancelar);

                card.appendChild(titulo);
                card.appendChild(gridEdicion);
                card.appendChild(acciones);
                lista.appendChild(card);
                return;
            }

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre;

            const plataforma = document.createElement("p");
            plataforma.textContent = "Plataforma: " + producto.plataforma;

            const precio = document.createElement("p");
            precio.className = "precio";
            precio.textContent = "$" + formatoCLP(Number(producto.precio)) + " CLP";

            const cantidad = document.createElement("p");
            cantidad.textContent = "Cantidad: " + Number(producto.cantidad || 0);

            const btnEliminar = document.createElement("button");
            btnEliminar.type = "button";
            btnEliminar.className = "btn-eliminar";
            btnEliminar.textContent = "Eliminar";
            btnEliminar.addEventListener("click", function () {
                const actual = leerProductos();
                actual.splice(index, 1);
                guardarProductos(actual);
                render();
            });

            const btnEditar = document.createElement("button");
            btnEditar.type = "button";
            btnEditar.className = "btn-editar";
            btnEditar.textContent = "Editar";
            btnEditar.addEventListener("click", function () {
                editandoId = producto.id;
                render();
            });

            const acciones = document.createElement("div");
            acciones.className = "acciones-admin";
            acciones.appendChild(btnEditar);
            acciones.appendChild(btnEliminar);

            card.appendChild(nombre);
            card.appendChild(plataforma);
            card.appendChild(precio);
            card.appendChild(cantidad);
            card.appendChild(acciones);
            lista.appendChild(card);
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = form.nombre.value.trim();
        const plataforma = form.plataforma.value;
        const precio = Number(form.precio.value);
        const cantidad = Number(form.cantidad.value);

        if (!nombre || !plataforma || precio < 0 || !cantidad || cantidad <= 0) {
            return;
        }

        const productos = leerProductos();
        productos.push({
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            nombre: nombre,
            plataforma: plataforma,
            precio: precio,
            cantidad: cantidad
        });

        guardarProductos(productos);
        form.reset();
        selectNombre.disabled = true;
        selectNombre.innerHTML = '<option value=\"\">Selecciona un juego</option>';
        render();
    });

    btnLogout.addEventListener("click", function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "tienda.html";
    });

    selectPlataforma.addEventListener("change", function () {
        actualizarJuegosDisponibles();
    });

    selectNombre.disabled = true;
    render();
})();
