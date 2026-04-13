(function () {
    const STORAGE_KEY = "tienda_juegos_2026";
    const CART_KEY = "tienda_carrito_2026";
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "1234";

    const catalogo = document.getElementById("home-catalogo");
    const vacio = document.getElementById("home-catalogo-vacio");
    const carritoLista = document.getElementById("home-carrito-lista");
    const carritoVacio = document.getElementById("home-carrito-vacio");
    const carritoSubtotal = document.getElementById("home-carrito-subtotal");
    const carritoDescuento = document.getElementById("home-carrito-descuento");
    const carritoTotal = document.getElementById("home-carrito-total");

    const descuentoEstado = document.getElementById("descuento-estado");
    const descuentoToast = document.getElementById("descuento-toast");
    const descuentoPorcentajeInput = document.getElementById("descuento-porcentaje");
    const btnAplicarDescuento = document.getElementById("btn-aplicar-descuento");
    const btnLimpiarDescuento = document.getElementById("btn-limpiar-descuento");
    const modalDescuento = document.getElementById("modal-descuento");
    const modalAdminUser = document.getElementById("modal-admin-user");
    const modalAdminPass = document.getElementById("modal-admin-pass");
    const modalDescuentoError = document.getElementById("modal-descuento-error");
    const btnModalAutenticar = document.getElementById("btn-modal-autenticar");
    const btnModalCancelar = document.getElementById("btn-modal-cancelar");

    if (!catalogo || !carritoLista || !carritoTotal || !carritoSubtotal || !carritoDescuento) {
        return;
    }

    let descuentoActivo = 0;
    let descuentoPendiente = 0;
    let toastTimeoutId = null;

    function leerProductos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function leerCarrito() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function guardarCarrito(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    }

    function formatoCLP(valor) {
        return new Intl.NumberFormat("es-CL").format(valor);
    }

    function guardarProductos(productos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    }

    function normalizarProductos(productos) {
        let cambiado = false;
        const normalizados = productos.map(function (p) {
            const nuevo = Object.assign({}, p);
            if (!nuevo.id) {
                nuevo.id = Date.now().toString() + Math.random().toString(16).slice(2);
                cambiado = true;
            }
            if (!nuevo.cantidad || Number(nuevo.cantidad) < 0) {
                nuevo.cantidad = 0;
                cambiado = true;
            }
            nuevo.cantidad = Number(nuevo.cantidad);
            return nuevo;
        });
        if (cambiado) {
            guardarProductos(normalizados);
        }
        return normalizados;
    }

    function renderCatalogo() {
        const productos = normalizarProductos(leerProductos());
        catalogo.innerHTML = "";
        vacio.style.display = productos.length === 0 ? "block" : "none";

        productos.forEach(function (producto) {
            const card = document.createElement("div");
            card.className = "producto-card";

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre;

            const plataforma = document.createElement("p");
            plataforma.textContent = "Plataforma: " + producto.plataforma;

            const precio = document.createElement("p");
            precio.className = "precio";
            precio.textContent = "$" + formatoCLP(Number(producto.precio)) + " CLP";

            const stock = document.createElement("p");
            stock.textContent = "Cantidad disponible: " + Number(producto.cantidad || 0);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-inacap";
            btn.textContent = "Agregar al carrito";
            if (Number(producto.cantidad || 0) <= 0) {
                btn.disabled = true;
                btn.textContent = "Sin stock";
            }
            btn.addEventListener("click", function () {
                const catalogoActual = normalizarProductos(leerProductos());
                const itemCatalogo = catalogoActual.find(function (p) {
                    return p.id === producto.id;
                });

                if (!itemCatalogo || Number(itemCatalogo.cantidad) <= 0) {
                    renderCatalogo();
                    return;
                }

                const carrito = leerCarrito();
                const itemCarrito = carrito.find(function (c) {
                    return c.id === itemCatalogo.id;
                });

                if (itemCarrito) {
                    itemCarrito.cantidad = Number(itemCarrito.cantidad || 0) + 1;
                } else {
                    carrito.push({
                        id: itemCatalogo.id,
                        nombre: itemCatalogo.nombre,
                        plataforma: itemCatalogo.plataforma,
                        precio: Number(itemCatalogo.precio),
                        cantidad: 1
                    });
                }

                itemCatalogo.cantidad = Number(itemCatalogo.cantidad) - 1;
                guardarProductos(catalogoActual);
                guardarCarrito(carrito);
                renderCatalogo();
                renderCarrito();
            });

            card.appendChild(nombre);
            card.appendChild(plataforma);
            card.appendChild(precio);
            card.appendChild(stock);
            card.appendChild(btn);
            catalogo.appendChild(card);
        });
    }

    function actualizarEstadoDescuento() {
        if (!descuentoEstado || !descuentoPorcentajeInput || !btnAplicarDescuento) {
            return;
        }

        const valor = Number(descuentoPorcentajeInput.value || 0);
        btnAplicarDescuento.disabled = false;

        descuentoEstado.textContent = valor > 0
            ? "Para aplicar este descuento debes validar con usuario admin."
            : "Sin descuento, no requiere validacion de administrador.";
    }

    function abrirModalDescuento(valor) {
        if (!modalDescuento || !modalAdminUser || !modalAdminPass || !modalDescuentoError) {
            return;
        }

        descuentoPendiente = valor;
        modalAdminUser.value = "";
        modalAdminPass.value = "";
        modalDescuentoError.textContent = "";
        modalDescuento.classList.add("is-open");
        modalDescuento.setAttribute("aria-hidden", "false");
        modalAdminUser.focus();
    }

    function cerrarModalDescuento() {
        if (!modalDescuento) {
            return;
        }

        modalDescuento.classList.remove("is-open");
        modalDescuento.setAttribute("aria-hidden", "true");
    }

    function mostrarToastError(mensaje) {
        if (!descuentoToast) {
            return;
        }

        if (toastTimeoutId) {
            clearTimeout(toastTimeoutId);
        }

        descuentoToast.textContent = mensaje;
        descuentoToast.classList.add("is-visible");

        toastTimeoutId = setTimeout(function () {
            descuentoToast.classList.remove("is-visible");
            descuentoToast.textContent = "";
            toastTimeoutId = null;
        }, 3000);
    }

    function renderCarrito() {
        const carrito = leerCarrito();
        carritoLista.innerHTML = "";
        carritoVacio.style.display = carrito.length === 0 ? "block" : "none";

        let total = 0;

        carrito.forEach(function (item, index) {
            const cantidad = Number(item.cantidad || 1);
            const subtotal = Number(item.precio) * cantidad;
            total += subtotal;

            const fila = document.createElement("div");
            fila.className = "carrito-item";

            const texto = document.createElement("span");
            texto.textContent = item.nombre + " (" + item.plataforma + ") x" + cantidad + " - $" + formatoCLP(subtotal);

            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "btn-eliminar";
            quitar.textContent = "Quitar 1";
            quitar.addEventListener("click", function () {
                const actual = leerCarrito();
                const itemActual = actual[index];
                if (!itemActual) {
                    return;
                }

                itemActual.cantidad = Number(itemActual.cantidad || 1) - 1;
                if (itemActual.cantidad <= 0) {
                    actual.splice(index, 1);
                }

                const catalogoActual = normalizarProductos(leerProductos());
                const itemCatalogo = catalogoActual.find(function (p) {
                    return p.id === item.id;
                });
                if (itemCatalogo) {
                    itemCatalogo.cantidad = Number(itemCatalogo.cantidad || 0) + 1;
                    guardarProductos(catalogoActual);
                }

                guardarCarrito(actual);
                renderCatalogo();
                renderCarrito();
            });

            fila.appendChild(texto);
            fila.appendChild(quitar);
            carritoLista.appendChild(fila);
        });

        const descuentoMonto = Math.round(total * (descuentoActivo / 100));
        const totalFinal = Math.max(0, total - descuentoMonto);

        carritoSubtotal.textContent = "Subtotal: $" + formatoCLP(total) + " CLP";
        carritoDescuento.textContent = "Descuento: $" + formatoCLP(descuentoMonto) + " CLP (" + descuentoActivo + "%)";
        carritoTotal.textContent = "Total carrito: $" + formatoCLP(totalFinal) + " CLP";
    }

    if (btnAplicarDescuento) {
        btnAplicarDescuento.addEventListener("click", function () {
            const valor = Number(descuentoPorcentajeInput ? descuentoPorcentajeInput.value : 0);
            if (Number.isNaN(valor) || valor < 0 || valor > 100) {
                alert("Ingresa un descuento valido entre 0 y 100.");
                return;
            }

            if (valor > 0) {
                abrirModalDescuento(valor);
                return;
            }

            descuentoActivo = valor;
            renderCarrito();
        });
    }

    if (btnLimpiarDescuento) {
        btnLimpiarDescuento.addEventListener("click", function () {
            descuentoActivo = 0;
            descuentoPendiente = 0;
            if (descuentoPorcentajeInput) {
                descuentoPorcentajeInput.value = "";
            }
            actualizarEstadoDescuento();
            renderCarrito();
        });
    }

    if (btnModalAutenticar) {
        btnModalAutenticar.addEventListener("click", function () {
            const usuario = modalAdminUser ? modalAdminUser.value.trim() : "";
            const clave = modalAdminPass ? modalAdminPass.value : "";

            if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
                descuentoActivo = descuentoPendiente;
                descuentoPendiente = 0;
                cerrarModalDescuento();
                renderCarrito();
                return;
            }

            if (modalDescuentoError) {
                modalDescuentoError.textContent = "error, descuento no aplicado";
            }

            cerrarModalDescuento();
            descuentoPendiente = 0;
            if (descuentoPorcentajeInput) {
                descuentoPorcentajeInput.value = "";
                descuentoPorcentajeInput.focus();
            }
            actualizarEstadoDescuento();
            mostrarToastError("Error, descuento no aplicado");
        });
    }

    if (btnModalCancelar) {
        btnModalCancelar.addEventListener("click", function () {
            descuentoPendiente = 0;
            cerrarModalDescuento();
        });
    }

    if (modalDescuento) {
        modalDescuento.addEventListener("click", function (event) {
            if (event.target === modalDescuento) {
                descuentoPendiente = 0;
                cerrarModalDescuento();
            }
        });
    }

    if (descuentoPorcentajeInput) {
        descuentoPorcentajeInput.disabled = false;
        descuentoPorcentajeInput.addEventListener("input", function () {
            actualizarEstadoDescuento();
        });
    }

    actualizarEstadoDescuento();
    renderCatalogo();
    renderCarrito();
})();
