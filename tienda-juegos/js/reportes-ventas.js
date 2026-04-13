(function () {
    const AUTH_KEY = "tienda_admin_auth";
    const HISTORIAL_KEY = "tienda_ventas_historial_2026";
    const VENTAS_CARRITOS_KEY = "tienda_ventas_carritos_2026";

    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const kpiVentasTotales = document.getElementById("kpi-ventas-totales");
    const kpiMontoTotal = document.getElementById("kpi-monto-total");
    const kpiMejorVendedor = document.getElementById("kpi-mejor-vendedor");
    const kpiTopProducto = document.getElementById("kpi-top-producto");

    const rankingProductos = document.getElementById("ranking-productos");
    const rankingVacio = document.getElementById("ranking-vacio");

    const ventasVacio = document.getElementById("ventas-vacio");
    const ventasTablaWrap = document.getElementById("ventas-tabla-wrap");
    const ventasTbody = document.getElementById("ventas-tbody");
    const btnLogoutReportes = document.getElementById("btn-logout-reportes");
    const chartVendedores = document.getElementById("chart-vendedores");
    const chartProductos = document.getElementById("chart-productos");
    const chartsVacio = document.getElementById("charts-vacio");
    const filtroPeriodo = document.getElementById("filtro-periodo");
    const filtroFechaDesde = document.getElementById("filtro-fecha-desde");
    const filtroFechaHasta = document.getElementById("filtro-fecha-hasta");
    const btnAplicarPeriodo = document.getElementById("btn-aplicar-periodo");
    const filtroResumen = document.getElementById("filtro-resumen");

    function leerHistorial() {
        try {
            const raw = localStorage.getItem(HISTORIAL_KEY);
            const historial = raw ? JSON.parse(raw) : [];
            return Array.isArray(historial) ? historial : [];
        } catch (error) {
            return [];
        }
    }

    function leerVentasActivas() {
        try {
            const raw = localStorage.getItem(VENTAS_CARRITOS_KEY);
            const carritos = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(carritos)) return [];

            return carritos.map(function (carrito) {
                const items = Array.isArray(carrito.items) ? carrito.items : [];
                const total = items.reduce(function (acc, item) {
                    return acc + Number(item.precio || 0) * Number(item.cantidad || 0);
                }, 0);

                return {
                    idVenta: carrito.id,
                    cliente: carrito.cliente || "Cliente en proceso",
                    vendedor: "Venta activa",
                    fecha: carrito.creadaEn || Date.now(),
                    total: total,
                    items: items.map(function (item) {
                        return {
                            id: item.id,
                            nombre: item.nombre,
                            plataforma: item.plataforma,
                            precioUnitario: Number(item.precio || 0),
                            cantidad: Number(item.cantidad || 0),
                            subtotal: Number(item.precio || 0) * Number(item.cantidad || 0)
                        };
                    })
                };
            }).filter(function (venta) {
                return Array.isArray(venta.items) && venta.items.length > 0;
            });
        } catch (error) {
            return [];
        }
    }

    function formatoCLP(valor) {
        return "$" + new Intl.NumberFormat("es-CL").format(Number(valor || 0));
    }

    function inicioDia(fecha) {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0).getTime();
    }

    function finDia(fecha) {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999).getTime();
    }

    function obtenerRangoPeriodo() {
        const ahora = new Date();
        const tipo = filtroPeriodo ? filtroPeriodo.value : "todo";

        if (tipo === "hoy") {
            return {
                desde: inicioDia(ahora),
                hasta: finDia(ahora),
                etiqueta: "Hoy"
            };
        }

        if (tipo === "semana") {
            const desde = new Date(ahora.getTime() - (6 * 24 * 60 * 60 * 1000));
            return {
                desde: inicioDia(desde),
                hasta: finDia(ahora),
                etiqueta: "Ultimos 7 dias"
            };
        }

        if (tipo === "mes") {
            const desde = new Date(ahora.getTime() - (29 * 24 * 60 * 60 * 1000));
            return {
                desde: inicioDia(desde),
                hasta: finDia(ahora),
                etiqueta: "Ultimos 30 dias"
            };
        }

        if (tipo === "personalizado") {
            const desdeValor = filtroFechaDesde && filtroFechaDesde.value ? new Date(filtroFechaDesde.value) : null;
            const hastaValor = filtroFechaHasta && filtroFechaHasta.value ? new Date(filtroFechaHasta.value) : null;

            if (!desdeValor || !hastaValor) {
                return {
                    desde: null,
                    hasta: null,
                    etiqueta: "Personalizado (incompleto)"
                };
            }

            return {
                desde: inicioDia(desdeValor),
                hasta: finDia(hastaValor),
                etiqueta: "Personalizado"
            };
        }

        return {
            desde: null,
            hasta: null,
            etiqueta: "Todo"
        };
    }

    function filtrarPorRango(ventas, rango) {
        if (rango.desde === null || rango.hasta === null) {
            if (rango.etiqueta.indexOf("incompleto") >= 0) {
                return [];
            }
            return ventas;
        }

        return ventas.filter(function (venta) {
            const fecha = Number(venta.fecha || 0);
            return fecha >= rango.desde && fecha <= rango.hasta;
        });
    }

    function actualizarEstadoControlesPeriodo() {
        const personalizado = filtroPeriodo && filtroPeriodo.value === "personalizado";
        if (filtroFechaDesde) filtroFechaDesde.disabled = !personalizado;
        if (filtroFechaHasta) filtroFechaHasta.disabled = !personalizado;
    }

    function calcularKPIs(historial) {
        const ventasTotales = historial.length;
        let montoTotal = 0;

        const ventasPorVendedor = {};
        const unidadesPorProducto = {};

        historial.forEach(function (venta) {
            const totalVenta = Number(venta.total || 0);
            montoTotal += totalVenta;

            const vendedor = venta.vendedor || "Sin vendedor";
            ventasPorVendedor[vendedor] = (ventasPorVendedor[vendedor] || 0) + totalVenta;

            const items = Array.isArray(venta.items) ? venta.items : [];
            items.forEach(function (item) {
                const nombre = item.nombre || "Producto sin nombre";
                const cantidad = Number(item.cantidad || 0);
                unidadesPorProducto[nombre] = (unidadesPorProducto[nombre] || 0) + cantidad;
            });
        });

        const mejorVendedor = Object.entries(ventasPorVendedor)
            .sort(function (a, b) { return b[1] - a[1]; })[0];

        const topProducto = Object.entries(unidadesPorProducto)
            .sort(function (a, b) { return b[1] - a[1]; })[0];

        const rankingProductosOrdenado = Object.entries(unidadesPorProducto)
            .sort(function (a, b) { return b[1] - a[1]; });

        return {
            ventasTotales: ventasTotales,
            montoTotal: montoTotal,
            mejorVendedor: mejorVendedor,
            topProducto: topProducto,
            rankingProductos: rankingProductosOrdenado,
            ventasPorVendedor: ventasPorVendedor,
            unidadesPorProducto: unidadesPorProducto
        };
    }

    function renderBarChart(contenedor, entradas, formateadorValor) {
        if (!contenedor) return;

        contenedor.innerHTML = "";
        if (!entradas.length) return;

        const max = Math.max.apply(null, entradas.map(function (item) { return Number(item[1] || 0); }));

        entradas.forEach(function (item) {
            const nombre = item[0];
            const valor = Number(item[1] || 0);
            const porcentaje = max > 0 ? Math.max(6, Math.round((valor / max) * 100)) : 0;

            const row = document.createElement("div");
            row.className = "bar-row";

            const label = document.createElement("div");
            label.className = "bar-label";
            label.innerHTML = "<span>" + nombre + "</span><strong>" + formateadorValor(valor) + "</strong>";

            const track = document.createElement("div");
            track.className = "bar-track";

            const fill = document.createElement("div");
            fill.className = "bar-fill";
            fill.style.width = porcentaje + "%";

            track.appendChild(fill);
            row.appendChild(label);
            row.appendChild(track);
            contenedor.appendChild(row);
        });
    }

    function renderGraficos(kpis) {
        const vendedores = Object.entries(kpis.ventasPorVendedor || {})
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 6);

        const productos = Object.entries(kpis.unidadesPorProducto || {})
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 6);

        const hayDatos = vendedores.length > 0 || productos.length > 0;
        if (chartsVacio) {
            chartsVacio.style.display = hayDatos ? "none" : "block";
        }

        renderBarChart(chartVendedores, vendedores, function (valor) {
            return formatoCLP(valor);
        });

        renderBarChart(chartProductos, productos, function (valor) {
            return String(valor) + " uds.";
        });
    }

    function renderKPIs(kpis) {
        kpiVentasTotales.textContent = String(kpis.ventasTotales);
        kpiMontoTotal.textContent = formatoCLP(kpis.montoTotal);

        if (kpis.mejorVendedor) {
            kpiMejorVendedor.textContent = kpis.mejorVendedor[0] + " (" + formatoCLP(kpis.mejorVendedor[1]) + ")";
        } else {
            kpiMejorVendedor.textContent = "-";
        }

        if (kpis.topProducto) {
            kpiTopProducto.textContent = kpis.topProducto[0] + " (" + kpis.topProducto[1] + " uds.)";
        } else {
            kpiTopProducto.textContent = "-";
        }

        rankingProductos.innerHTML = "";
        rankingVacio.style.display = kpis.rankingProductos.length ? "none" : "block";

        kpis.rankingProductos.slice(0, 10).forEach(function (item) {
            const li = document.createElement("li");
            li.textContent = item[0] + " - " + item[1] + " unidades";
            rankingProductos.appendChild(li);
        });
    }

    function renderDetalle(historial) {
        ventasTbody.innerHTML = "";
        ventasVacio.style.display = historial.length ? "none" : "block";
        if (ventasTablaWrap) {
            ventasTablaWrap.style.display = historial.length ? "block" : "none";
        }

        const ordenado = historial.slice().sort(function (a, b) {
            return Number(b.fecha || 0) - Number(a.fecha || 0);
        });

        function resumenProductos(items) {
            const productos = items.map(function (item) {
                const nombre = item.nombre || "Producto";
                const cantidad = Number(item.cantidad || 0);
                return nombre + " x" + cantidad;
            });

            if (productos.length <= 3) {
                return productos.join(", ");
            }

            return productos.slice(0, 3).join(", ") + " +" + (productos.length - 3);
        }

        ordenado.forEach(function (venta) {
            const items = Array.isArray(venta.items) ? venta.items : [];
            const productosTexto = resumenProductos(items);
            const fila = document.createElement("tr");
            fila.innerHTML = ""
                + "<td>" + (venta.idVenta || "-") + "</td>"
                + "<td>" + new Date(venta.fecha || Date.now()).toLocaleString("es-CL") + "</td>"
                + "<td>" + (venta.cliente || "-") + "</td>"
                + "<td>" + (venta.vendedor || "-") + "</td>"
                + "<td>" + (productosTexto || "-") + "</td>"
                + "<td>" + items.length + "</td>"
                + "<td class='total-col'>" + formatoCLP(venta.total) + "</td>";
            ventasTbody.appendChild(fila);
        });
    }

    function render() {
        const historial = leerHistorial();
        const activas = leerVentasActivas();
        const rango = obtenerRangoPeriodo();

        if (filtroResumen) {
            filtroResumen.textContent = "Mostrando datos de: " + rango.etiqueta;
        }

        const historialFiltrado = filtrarPorRango(historial, rango);
        const activasFiltradas = filtrarPorRango(activas, rango);
        const universoMetricas = historialFiltrado.concat(activasFiltradas);
        const kpis = calcularKPIs(universoMetricas);

        renderKPIs(kpis);
        renderGraficos(kpis);
        renderDetalle(historialFiltrado);
    }

    if (btnLogoutReportes) {
        btnLogoutReportes.addEventListener("click", function () {
            localStorage.removeItem(AUTH_KEY);
            window.location.href = "tienda.html";
        });
    }

    if (filtroPeriodo) {
        filtroPeriodo.addEventListener("change", function () {
            actualizarEstadoControlesPeriodo();
            render();
        });
    }

    if (btnAplicarPeriodo) {
        btnAplicarPeriodo.addEventListener("click", function () {
            render();
        });
    }

    if (filtroFechaDesde) {
        filtroFechaDesde.addEventListener("change", function () {
            if (filtroPeriodo && filtroPeriodo.value === "personalizado") {
                render();
            }
        });
    }

    if (filtroFechaHasta) {
        filtroFechaHasta.addEventListener("change", function () {
            if (filtroPeriodo && filtroPeriodo.value === "personalizado") {
                render();
            }
        });
    }

    actualizarEstadoControlesPeriodo();

    render();

    setInterval(function () {
        render();
    }, 1500);
})();