(function () {
    const AUTH_KEY = "tienda_admin_auth";
    const HISTORIAL_KEY = "tienda_ventas_historial_2026";
    const PRODUCTOS_KEY = "tienda_juegos_2026";

    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const lista = document.getElementById("ventas-admin-lista");
    const vacio = document.getElementById("ventas-admin-vacio");
    const btnLogout = document.getElementById("btn-logout-gestion-ventas");
    const inputBusqueda = document.getElementById("ventas-admin-busqueda");
    const selectVendedor = document.getElementById("ventas-admin-filtro-vendedor");
    const selectOrden = document.getElementById("ventas-admin-orden");
    const btnLimpiarFiltros = document.getElementById("btn-ventas-admin-limpiar");
    const resumen = document.getElementById("ventas-admin-resumen");

    if (!lista || !vacio || !btnLogout) {
        return;
    }

    let editandoId = null;
    const filtros = {
        busqueda: "",
        vendedor: "",
        orden: selectOrden ? String(selectOrden.value || "fecha_desc") : "fecha_desc"
    };

    function leerHistorial() {
        try {
            const raw = localStorage.getItem(HISTORIAL_KEY);
            const historial = raw ? JSON.parse(raw) : [];
            return Array.isArray(historial) ? historial : [];
        } catch (error) {
            return [];
        }
    }

    function guardarHistorial(historial) {
        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
    }

    function leerProductos() {
        try {
            const raw = localStorage.getItem(PRODUCTOS_KEY);
            const productos = raw ? JSON.parse(raw) : [];
            return Array.isArray(productos) ? productos : [];
        } catch (error) {
            return [];
        }
    }

    function guardarProductos(productos) {
        localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
    }

    function reintegrarStockDeVenta(venta) {
        const items = Array.isArray(venta.items) ? venta.items : [];
        if (!items.length) return;

        const productos = leerProductos();

        items.forEach(function (itemVenta) {
            const cantidadVenta = Number(itemVenta.cantidad || 0);
            if (cantidadVenta <= 0) return;

            let producto = productos.find(function (p) {
                return p.id && itemVenta.id && p.id === itemVenta.id;
            });

            if (!producto) {
                producto = productos.find(function (p) {
                    return String(p.nombre || "").toLowerCase() === String(itemVenta.nombre || "").toLowerCase()
                        && String(p.plataforma || "").toLowerCase() === String(itemVenta.plataforma || "").toLowerCase();
                });
            }

            if (producto) {
                producto.cantidad = Number(producto.cantidad || 0) + cantidadVenta;
                return;
            }

            productos.push({
                id: itemVenta.id || (Date.now().toString() + Math.random().toString(16).slice(2)),
                nombre: itemVenta.nombre || "Producto recuperado",
                plataforma: itemVenta.plataforma || "PC",
                precio: Number(itemVenta.precioUnitario || 0),
                cantidad: cantidadVenta
            });
        });

        guardarProductos(productos);
    }

    function formatoCLP(valor) {
        return "$" + new Intl.NumberFormat("es-CL").format(Number(valor || 0));
    }

    function textoPlano(valor) {
        return String(valor || "").trim().toLowerCase();
    }

    function obtenerIdVenta(venta) {
        return String(venta.correlativo || venta.idVenta || "");
    }

    function ordenarVentas(ventas, criterio) {
        const copia = ventas.slice();
        if (criterio === "fecha_asc") {
            return copia.sort(function (a, b) {
                return Number(a.fecha || 0) - Number(b.fecha || 0);
            });
        }
        if (criterio === "total_desc") {
            return copia.sort(function (a, b) {
                return Number(b.total || 0) - Number(a.total || 0);
            });
        }
        if (criterio === "total_asc") {
            return copia.sort(function (a, b) {
                return Number(a.total || 0) - Number(b.total || 0);
            });
        }

        return copia.sort(function (a, b) {
            return Number(b.fecha || 0) - Number(a.fecha || 0);
        });
    }

    function actualizarOpcionesVendedor(historial) {
        if (!selectVendedor) return;

        const valorActual = String(selectVendedor.value || "");
        const vendedores = Array.from(new Set(historial.map(function (venta) {
            return String(venta.vendedor || "").trim();
        }).filter(Boolean))).sort(function (a, b) {
            return a.localeCompare(b, "es");
        });

        selectVendedor.innerHTML = "";

        const todos = document.createElement("option");
        todos.value = "";
        todos.textContent = "Todos los vendedores";
        selectVendedor.appendChild(todos);

        vendedores.forEach(function (vendedor) {
            const option = document.createElement("option");
            option.value = vendedor;
            option.textContent = vendedor;
            selectVendedor.appendChild(option);
        });

        if (vendedores.includes(valorActual)) {
            selectVendedor.value = valorActual;
        } else {
            selectVendedor.value = "";
            filtros.vendedor = "";
        }
    }

    function ventaCoincideBusqueda(venta, busqueda) {
        if (!busqueda) return true;

        const id = textoPlano(obtenerIdVenta(venta));
        const cliente = textoPlano(venta.cliente);
        const vendedor = textoPlano(venta.vendedor);
        const productos = (Array.isArray(venta.items) ? venta.items : []).map(function (item) {
            return textoPlano(item.nombre);
        }).join(" ");

        const base = [id, cliente, vendedor, productos].join(" ");
        return base.includes(busqueda);
    }

    function aplicarFiltros(historial) {
        const vendedorFiltro = textoPlano(filtros.vendedor);
        const busqueda = textoPlano(filtros.busqueda);

        const filtrado = historial.filter(function (venta) {
            const vendedor = textoPlano(venta.vendedor);
            if (vendedorFiltro && vendedor !== vendedorFiltro) {
                return false;
            }

            return ventaCoincideBusqueda(venta, busqueda);
        });

        return ordenarVentas(filtrado, filtros.orden);
    }

    function actualizarResumen(historialTotal, historialFiltrado) {
        if (!resumen) return;

        const totalGeneral = historialTotal.reduce(function (acc, venta) {
            return acc + Number(venta.total || 0);
        }, 0);

        const totalFiltrado = historialFiltrado.reduce(function (acc, venta) {
            return acc + Number(venta.total || 0);
        }, 0);

        resumen.textContent = "Mostrando " + historialFiltrado.length + " de " + historialTotal.length
            + " ventas | Total filtrado: " + formatoCLP(totalFiltrado)
            + " | Total general: " + formatoCLP(totalGeneral);
    }

    function resumenProductos(items) {
        const listaItems = Array.isArray(items) ? items : [];
        if (!listaItems.length) return "-";

        const vista = listaItems.slice(0, 3).map(function (item) {
            const nombre = item.nombre || "Producto";
            const cantidad = Number(item.cantidad || 0);
            return nombre + " x" + cantidad;
        }).join(", ");

        if (listaItems.length > 3) {
            return vista + " y " + (listaItems.length - 3) + " mas";
        }

        return vista;
    }

    function normalizarItems(items) {
        const base = (Array.isArray(items) ? items : []).map(function (item) {
            const nombre = String(item.nombre || "").trim();
            const plataforma = item.plataforma || "PC";
            const cantidad = Number(item.cantidad || 0);
            const precioUnitario = Number(item.precioUnitario || 0);
            return {
                id: item.id,
                nombre: nombre,
                plataforma: plataforma,
                cantidad: cantidad,
                precioUnitario: precioUnitario
            };
        }).filter(function (item) {
            return item.nombre && item.cantidad > 0 && item.precioUnitario >= 0;
        });

        const fusion = new Map();
        base.forEach(function (item) {
            const key = (item.id ? String(item.id) : textoPlano(item.nombre)) + "|" + textoPlano(item.plataforma);
            if (!fusion.has(key)) {
                fusion.set(key, {
                    id: item.id,
                    nombre: item.nombre,
                    plataforma: item.plataforma,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    subtotal: item.cantidad * item.precioUnitario
                });
                return;
            }

            const actual = fusion.get(key);
            actual.cantidad += item.cantidad;
            actual.precioUnitario = item.precioUnitario;
            actual.subtotal = actual.cantidad * actual.precioUnitario;
        });

        return Array.from(fusion.values());
    }

    function crearCampoEdicion(labelTexto, input) {
        const box = document.createElement("div");
        box.className = "edicion-campo";
        const label = document.createElement("label");
        label.textContent = labelTexto;
        box.appendChild(label);
        box.appendChild(input);
        return box;
    }

    function crearTarjetaVenta(venta) {
        const ventaId = obtenerIdVenta(venta);
        const card = document.createElement("div");
        card.className = "producto-card venta-admin-card";

        const titulo = document.createElement("h3");
        titulo.textContent = "Venta #" + ventaId;

        const meta = document.createElement("p");
        meta.className = "venta-admin-meta";
        meta.textContent = "Fecha: " + new Date(Number(venta.fecha || Date.now())).toLocaleString("es-CL");

        const cliente = document.createElement("p");
        cliente.textContent = "Cliente: " + (venta.cliente || "-");

        const vendedor = document.createElement("p");
        vendedor.textContent = "Vendedor: " + (venta.vendedor || "-");

        const listaItems = Array.isArray(venta.items) ? venta.items : [];

        const items = document.createElement("p");
        items.textContent = "Items: " + listaItems.length;

        const productos = document.createElement("p");
        productos.textContent = "Productos: " + resumenProductos(listaItems);

        const total = document.createElement("p");
        total.className = "precio";
        total.textContent = "Total: " + formatoCLP(venta.total);

        const acciones = document.createElement("div");
        acciones.className = "acciones-admin";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-editar";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", function () {
            editandoId = ventaId;
            render();
        });

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-eliminar";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", function () {
            const confirmar = confirm("¿Eliminar la venta #" + ventaId + "?");
            if (!confirmar) return;

            reintegrarStockDeVenta(venta);

            const filtrado = leerHistorial().filter(function (v) {
                return obtenerIdVenta(v) !== ventaId;
            });
            guardarHistorial(filtrado);

            if (editandoId === ventaId) {
                editandoId = null;
            }
            render();
        });

        acciones.appendChild(btnEditar);
        acciones.appendChild(btnEliminar);

        card.appendChild(titulo);
        card.appendChild(meta);
        card.appendChild(cliente);
        card.appendChild(vendedor);
        card.appendChild(items);
        card.appendChild(productos);
        card.appendChild(total);
        card.appendChild(acciones);
        return card;
    }

    function crearEditorVenta(venta) {
        const ventaId = obtenerIdVenta(venta);
        const card = document.createElement("div");
        card.className = "producto-card modo-edicion venta-admin-editor";

        const titulo = document.createElement("h3");
        titulo.textContent = "Editar venta #" + ventaId;

        const clienteInput = document.createElement("input");
        clienteInput.type = "text";
        clienteInput.value = String(venta.cliente || "");

        const vendedorInput = document.createElement("input");
        vendedorInput.type = "text";
        vendedorInput.value = String(venta.vendedor || "");

        const fechaInput = document.createElement("input");
        fechaInput.type = "datetime-local";
        const fechaActual = new Date(Number(venta.fecha || Date.now()));
        fechaInput.value = new Date(fechaActual.getTime() - (fechaActual.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        const totalInput = document.createElement("input");
        totalInput.type = "number";
        totalInput.min = "0";
        totalInput.step = "1";
        totalInput.value = String(Math.round(Number(venta.total || 0)));
        totalInput.readOnly = true;

        const grid = document.createElement("div");
        grid.className = "edicion-grid";
        grid.appendChild(crearCampoEdicion("Cliente:", clienteInput));
        grid.appendChild(crearCampoEdicion("Vendedor:", vendedorInput));
        grid.appendChild(crearCampoEdicion("Fecha:", fechaInput));
        grid.appendChild(crearCampoEdicion("Total (CLP):", totalInput));

        const detalleProductos = document.createElement("p");
        detalleProductos.className = "nota";
        detalleProductos.textContent = "Edita productos vendidos. El total se recalcula automaticamente y se fusionan lineas repetidas al guardar.";

        const productosDisponibles = leerProductos().slice().sort(function (a, b) {
            return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
        });

        const itemsEdicion = (Array.isArray(venta.items) ? venta.items : []).map(function (item) {
            return {
                id: item.id || (Date.now().toString() + Math.random().toString(16).slice(2)),
                nombre: item.nombre || "",
                plataforma: item.plataforma || "PC",
                cantidad: Number(item.cantidad || 1),
                precioUnitario: Number(item.precioUnitario || item.precio || 0),
                subtotal: Number(item.subtotal || 0)
            };
        });

        const tituloProductos = document.createElement("h3");
        tituloProductos.textContent = "Productos vendidos";

        const ayudaProductos = document.createElement("p");
        ayudaProductos.className = "nota";
        ayudaProductos.textContent = "Selecciona producto de catalogo o edita manualmente. Puedes sincronizar nombre, plataforma y precio desde el catalogo actual.";

        const encabezadoProductos = document.createElement("div");
        encabezadoProductos.className = "ventas-producto-head";
        encabezadoProductos.innerHTML = ""
            + "<span>Producto</span>"
            + "<span>Plataforma</span>"
            + "<span>Cantidad</span>"
            + "<span>Precio Unit.</span>"
            + "<span>Subtotal</span>"
            + "<span>Accion</span>";

        const productosEditor = document.createElement("div");
        productosEditor.className = "ventas-productos-editor";

        function recalcularTotalDesdeProductos() {
            let totalCalculado = 0;

            itemsEdicion.forEach(function (item) {
                const cantidad = Number(item.cantidad || 0);
                const precio = Number(item.precioUnitario || 0);
                item.subtotal = cantidad * precio;
                totalCalculado += item.subtotal;
            });

            totalInput.value = String(Math.round(totalCalculado));
        }

        function buscarProductoCatalogo(item) {
            if (!item) return null;

            let encontrado = productosDisponibles.find(function (p) {
                return p.id && item.id && p.id === item.id;
            });

            if (encontrado) return encontrado;

            encontrado = productosDisponibles.find(function (p) {
                return textoPlano(p.nombre) === textoPlano(item.nombre)
                    && textoPlano(p.plataforma) === textoPlano(item.plataforma);
            });

            return encontrado || null;
        }

        function cargarOpcionesCatalogo(select, item) {
            select.innerHTML = "";

            const base = document.createElement("option");
            base.value = "";
            base.textContent = "Seleccionar del catalogo";
            select.appendChild(base);

            productosDisponibles.forEach(function (producto) {
                const option = document.createElement("option");
                option.value = producto.id || (producto.nombre + "__" + producto.plataforma);
                option.textContent = producto.nombre + " (" + producto.plataforma + ") - "
                    + formatoCLP(producto.precio) + " - stock: " + Number(producto.cantidad || 0);
                select.appendChild(option);
            });

            const productoActual = buscarProductoCatalogo(item);
            if (productoActual) {
                select.value = productoActual.id || (productoActual.nombre + "__" + productoActual.plataforma);
            }
        }

        function crearFilaProducto(item, index) {
            const fila = document.createElement("div");
            fila.className = "ventas-producto-row";

            function crearCampoProducto(etiqueta, control) {
                const box = document.createElement("div");
                box.className = "ventas-producto-field";
                const label = document.createElement("label");
                label.textContent = etiqueta;
                box.appendChild(label);
                box.appendChild(control);
                return box;
            }

            const bloqueProducto = document.createElement("div");
            bloqueProducto.className = "ventas-producto-producto ventas-producto-field";

            const labelProducto = document.createElement("label");
            labelProducto.textContent = "Producto";

            const selectCatalogo = document.createElement("select");
            selectCatalogo.className = "ventas-producto-catalogo";
            cargarOpcionesCatalogo(selectCatalogo, item);

            const inputNombre = document.createElement("input");
            inputNombre.type = "text";
            inputNombre.placeholder = "Nombre producto";
            inputNombre.value = item.nombre;

            const stockInfo = document.createElement("p");
            stockInfo.className = "ventas-producto-stock";

            const selectPlataforma = document.createElement("select");
            ["PC", "PS4-PS5"].forEach(function (plat) {
                const op = document.createElement("option");
                op.value = plat;
                op.textContent = plat;
                selectPlataforma.appendChild(op);
            });
            selectPlataforma.value = item.plataforma;

            const inputCantidad = document.createElement("input");
            inputCantidad.type = "number";
            inputCantidad.min = "1";
            inputCantidad.step = "1";
            inputCantidad.value = String(item.cantidad > 0 ? item.cantidad : 1);

            const inputPrecio = document.createElement("input");
            inputPrecio.type = "number";
            inputPrecio.min = "0";
            inputPrecio.step = "1";
            inputPrecio.value = String(item.precioUnitario >= 0 ? item.precioUnitario : 0);

            const subtotal = document.createElement("p");
            subtotal.className = "ventas-producto-subtotal";
            subtotal.textContent = formatoCLP(Number(item.subtotal || 0));

            const btnQuitarProducto = document.createElement("button");
            btnQuitarProducto.type = "button";
            btnQuitarProducto.className = "btn-eliminar";
            btnQuitarProducto.textContent = "Quitar";

            function actualizarStockInfo() {
                const disponible = buscarProductoCatalogo(itemsEdicion[index]);
                if (!disponible) {
                    stockInfo.textContent = "Producto manual (sin referencia de catalogo)";
                    stockInfo.classList.remove("is-ok");
                    return;
                }

                stockInfo.textContent = "Stock actual en catalogo: " + Number(disponible.cantidad || 0);
                stockInfo.classList.add("is-ok");
            }

            selectCatalogo.addEventListener("change", function () {
                const seleccionado = productosDisponibles.find(function (p) {
                    const key = p.id || (p.nombre + "__" + p.plataforma);
                    return key === selectCatalogo.value;
                });

                if (!seleccionado) return;

                itemsEdicion[index].id = seleccionado.id || itemsEdicion[index].id;
                itemsEdicion[index].nombre = seleccionado.nombre;
                itemsEdicion[index].plataforma = seleccionado.plataforma;
                itemsEdicion[index].precioUnitario = Number(seleccionado.precio || 0);

                inputNombre.value = itemsEdicion[index].nombre;
                selectPlataforma.value = itemsEdicion[index].plataforma;
                inputPrecio.value = String(itemsEdicion[index].precioUnitario);

                recalcularTotalDesdeProductos();
                subtotal.textContent = formatoCLP(itemsEdicion[index].subtotal);
                actualizarStockInfo();
            });

            inputNombre.addEventListener("input", function () {
                itemsEdicion[index].nombre = inputNombre.value;
                actualizarStockInfo();
            });

            selectPlataforma.addEventListener("change", function () {
                itemsEdicion[index].plataforma = selectPlataforma.value;
                actualizarStockInfo();
            });

            inputCantidad.addEventListener("input", function () {
                itemsEdicion[index].cantidad = Number(inputCantidad.value || 0);
                recalcularTotalDesdeProductos();
                subtotal.textContent = formatoCLP(itemsEdicion[index].subtotal);
            });

            inputPrecio.addEventListener("input", function () {
                itemsEdicion[index].precioUnitario = Number(inputPrecio.value || 0);
                recalcularTotalDesdeProductos();
                subtotal.textContent = formatoCLP(itemsEdicion[index].subtotal);
            });

            btnQuitarProducto.addEventListener("click", function () {
                itemsEdicion.splice(index, 1);
                renderEditorProductos();
            });

            const campoPlataforma = crearCampoProducto("Plataforma", selectPlataforma);
            const campoCantidad = crearCampoProducto("Cantidad", inputCantidad);
            const campoPrecio = crearCampoProducto("Precio Unit.", inputPrecio);

            const campoSubtotal = document.createElement("div");
            campoSubtotal.className = "ventas-producto-field ventas-producto-field-subtotal";
            const labelSubtotal = document.createElement("label");
            labelSubtotal.textContent = "Subtotal";
            campoSubtotal.appendChild(labelSubtotal);
            campoSubtotal.appendChild(subtotal);

            const campoAccion = document.createElement("div");
            campoAccion.className = "ventas-producto-field ventas-producto-field-action";
            const labelAccion = document.createElement("label");
            labelAccion.textContent = "Accion";
            campoAccion.appendChild(labelAccion);
            campoAccion.appendChild(btnQuitarProducto);

            bloqueProducto.appendChild(labelProducto);
            bloqueProducto.appendChild(selectCatalogo);
            bloqueProducto.appendChild(inputNombre);
            bloqueProducto.appendChild(stockInfo);

            fila.appendChild(bloqueProducto);
            fila.appendChild(campoPlataforma);
            fila.appendChild(campoCantidad);
            fila.appendChild(campoPrecio);
            fila.appendChild(campoSubtotal);
            fila.appendChild(campoAccion);

            actualizarStockInfo();
            return fila;
        }

        function renderEditorProductos() {
            productosEditor.innerHTML = "";

            if (!itemsEdicion.length) {
                const vacio = document.createElement("p");
                vacio.className = "nota";
                vacio.textContent = "No hay productos en esta venta. Agrega al menos uno para guardar.";
                productosEditor.appendChild(vacio);
            }

            itemsEdicion.forEach(function (item, index) {
                productosEditor.appendChild(crearFilaProducto(item, index));
            });

            recalcularTotalDesdeProductos();
        }

        const accionesProductos = document.createElement("div");
        accionesProductos.className = "ventas-editor-actions";

        const btnAgregarProducto = document.createElement("button");
        btnAgregarProducto.type = "button";
        btnAgregarProducto.className = "btn-editar";
        btnAgregarProducto.textContent = "Agregar producto";
        btnAgregarProducto.addEventListener("click", function () {
            itemsEdicion.push({
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                nombre: "",
                plataforma: "PC",
                cantidad: 1,
                precioUnitario: 0,
                subtotal: 0
            });
            renderEditorProductos();
        });

        const btnSincronizarCatalogo = document.createElement("button");
        btnSincronizarCatalogo.type = "button";
        btnSincronizarCatalogo.className = "btn-inacap";
        btnSincronizarCatalogo.textContent = "Sincronizar desde catalogo";
        btnSincronizarCatalogo.addEventListener("click", function () {
            itemsEdicion.forEach(function (item) {
                const disponible = buscarProductoCatalogo(item);
                if (!disponible) return;

                item.id = disponible.id || item.id;
                item.nombre = disponible.nombre;
                item.plataforma = disponible.plataforma;
                item.precioUnitario = Number(disponible.precio || 0);
            });

            renderEditorProductos();
        });

        accionesProductos.appendChild(btnAgregarProducto);
        accionesProductos.appendChild(btnSincronizarCatalogo);

        renderEditorProductos();

        const acciones = document.createElement("div");
        acciones.className = "acciones-admin";

        const btnGuardar = document.createElement("button");
        btnGuardar.type = "button";
        btnGuardar.className = "btn-editar";
        btnGuardar.textContent = "Guardar";
        btnGuardar.addEventListener("click", function () {
            const historialActual = leerHistorial();
            const target = historialActual.find(function (v) {
                return obtenerIdVenta(v) === ventaId;
            });

            if (!target) {
                editandoId = null;
                render();
                return;
            }

            const cliente = clienteInput.value.trim();
            const vendedor = vendedorInput.value.trim();
            const fechaValor = fechaInput.value;
            const itemsNormalizados = normalizarItems(itemsEdicion);

            if (!cliente || !vendedor || !fechaValor || itemsNormalizados.length === 0) {
                alert("Completa los datos de la venta y al menos un producto valido.");
                return;
            }

            const total = itemsNormalizados.reduce(function (acc, item) {
                return acc + Number(item.subtotal || 0);
            }, 0);

            target.cliente = cliente;
            target.vendedor = vendedor;
            target.fecha = new Date(fechaValor).getTime();
            target.total = total;
            target.items = itemsNormalizados;

            guardarHistorial(historialActual);
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
        card.appendChild(grid);
        card.appendChild(detalleProductos);
        card.appendChild(tituloProductos);
        card.appendChild(ayudaProductos);
        card.appendChild(encabezadoProductos);
        card.appendChild(productosEditor);
        card.appendChild(accionesProductos);
        card.appendChild(acciones);
        return card;
    }

    function render() {
        const historialBase = leerHistorial();
        actualizarOpcionesVendedor(historialBase);

        const historial = aplicarFiltros(historialBase);
        actualizarResumen(historialBase, historial);

        lista.innerHTML = "";
        vacio.style.display = historial.length ? "none" : "block";

        const existeVentaEditando = historialBase.some(function (venta) {
            return obtenerIdVenta(venta) === String(editandoId);
        });

        if (editandoId && !existeVentaEditando) {
            editandoId = null;
        }

        historial.forEach(function (venta) {
            const ventaId = obtenerIdVenta(venta);
            const card = editandoId === ventaId
                ? crearEditorVenta(venta)
                : crearTarjetaVenta(venta);
            lista.appendChild(card);
        });
    }

    function bindFiltros() {
        if (inputBusqueda) {
            inputBusqueda.addEventListener("input", function () {
                filtros.busqueda = inputBusqueda.value;
                render();
            });
        }

        if (selectVendedor) {
            selectVendedor.addEventListener("change", function () {
                filtros.vendedor = String(selectVendedor.value || "");
                render();
            });
        }

        if (selectOrden) {
            selectOrden.addEventListener("change", function () {
                filtros.orden = String(selectOrden.value || "fecha_desc");
                render();
            });
        }

        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener("click", function () {
                filtros.busqueda = "";
                filtros.vendedor = "";
                filtros.orden = "fecha_desc";

                if (inputBusqueda) inputBusqueda.value = "";
                if (selectVendedor) selectVendedor.value = "";
                if (selectOrden) selectOrden.value = "fecha_desc";

                render();
            });
        }
    }

    btnLogout.addEventListener("click", function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "tienda.html";
    });

    bindFiltros();
    render();
})();
