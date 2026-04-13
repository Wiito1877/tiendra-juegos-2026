(function () {
    const AUTH_KEY = "tienda_admin_auth";
    const CONSULTAS_KEY = "tienda_consultas_contacto_2026";

    if (localStorage.getItem(AUTH_KEY) !== "ok") {
        window.location.href = "tienda.html";
        return;
    }

    const tbody = document.getElementById("consultas-tbody");
    const vacio = document.getElementById("consultas-vacio");
    const detalle = document.getElementById("consulta-detalle");
    const btnLogout = document.getElementById("btn-logout-consultas");

    if (!tbody || !vacio || !detalle || !btnLogout) {
        return;
    }

    function leerConsultas() {
        try {
            const raw = localStorage.getItem(CONSULTAS_KEY);
            const consultas = raw ? JSON.parse(raw) : [];
            return Array.isArray(consultas) ? consultas : [];
        } catch (error) {
            return [];
        }
    }

    function estadoClase(estado) {
        return String(estado || "").toLowerCase() === "respondida" ? "respondida" : "pendiente";
    }

    function renderDetalle(consulta) {
        const respuestas = Array.isArray(consulta.respuestas) ? consulta.respuestas : [];

        detalle.innerHTML = ""
            + "<h3>Consulta " + (consulta.codigo || "-") + "</h3>"
            + "<p class='detalle-linea'><strong>Nombre:</strong> " + (consulta.nombre || "-") + "</p>"
            + "<p class='detalle-linea'><strong>Email:</strong> " + (consulta.email || "-") + "</p>"
            + "<p class='detalle-linea'><strong>Telefono:</strong> " + (consulta.telefono || "-") + "</p>"
            + "<p class='detalle-linea'><strong>Motivo:</strong> " + (consulta.motivo || "-") + "</p>"
            + "<p class='detalle-linea'><strong>Preferencia:</strong> " + (consulta.preferencia || "-") + "</p>"
            + "<p class='detalle-linea'><strong>Estado:</strong> " + (consulta.estado || "Pendiente") + "</p>"
            + "<p class='detalle-linea'><strong>Mensaje:</strong></p>"
            + "<p class='nota detalle-mensaje'>" + (consulta.mensaje || "-") + "</p>"
            + "<h3>Respuestas guardadas</h3>";

        const lista = document.createElement("div");
        lista.className = "respuestas-lista";

        if (!respuestas.length) {
            const vacioRespuesta = document.createElement("p");
            vacioRespuesta.className = "detalle-vacio";
            vacioRespuesta.textContent = "Aun no hay respuestas registradas para esta consulta.";
            lista.appendChild(vacioRespuesta);
        } else {
            respuestas.slice().sort(function (a, b) {
                return Number(b.fecha || 0) - Number(a.fecha || 0);
            }).forEach(function (resp) {
                const item = document.createElement("div");
                item.className = "respuesta-item";
                item.innerHTML = ""
                    + "<p class='detalle-linea'><strong>Fecha:</strong> " + new Date(resp.fecha || Date.now()).toLocaleString("es-CL") + "</p>"
                    + "<p class='detalle-linea'><strong>Respuesta:</strong></p>"
                    + "<p class='detalle-linea detalle-mensaje'>" + (resp.mensaje || "-") + "</p>";
                lista.appendChild(item);
            });
        }

        const formRespuesta = document.createElement("div");
        formRespuesta.style.marginTop = "10px";
        formRespuesta.innerHTML = ""
            + "<label for='respuesta-admin-texto'><strong>Responder consulta:</strong></label>"
            + "<textarea id='respuesta-admin-texto' rows='4' placeholder='Escribe una respuesta para esta consulta...'></textarea>"
            + "<button id='btn-guardar-respuesta' type='button' class='btn-inacap'>Guardar respuesta</button>";

        detalle.appendChild(lista);
        detalle.appendChild(formRespuesta);

        const btnGuardar = document.getElementById("btn-guardar-respuesta");
        const txtRespuesta = document.getElementById("respuesta-admin-texto");

        btnGuardar.addEventListener("click", function () {
            const texto = String(txtRespuesta.value || "").trim();
            if (texto.length < 5) {
                alert("La respuesta debe tener al menos 5 caracteres.");
                txtRespuesta.focus();
                return;
            }

            const consultas = leerConsultas();
            const target = consultas.find(function (c) {
                return c.id === consulta.id;
            });

            if (!target) {
                return;
            }

            if (!Array.isArray(target.respuestas)) {
                target.respuestas = [];
            }

            target.respuestas.push({
                mensaje: texto,
                fecha: Date.now()
            });
            target.estado = "Respondida";

            localStorage.setItem(CONSULTAS_KEY, JSON.stringify(consultas));
            render();

            const actualizada = consultas.find(function (c) { return c.id === consulta.id; });
            if (actualizada) {
                renderDetalle(actualizada);
            }
        });
    }

    function render() {
        const consultas = leerConsultas().sort(function (a, b) {
            return Number(b.creadoEn || 0) - Number(a.creadoEn || 0);
        });

        tbody.innerHTML = "";
        vacio.style.display = consultas.length ? "none" : "block";

        consultas.forEach(function (consulta) {
            const fila = document.createElement("tr");
            fila.innerHTML = ""
                + "<td>" + (consulta.codigo || "-") + "</td>"
                + "<td>" + new Date(consulta.creadoEn || Date.now()).toLocaleString("es-CL") + "</td>"
                + "<td>" + (consulta.nombre || "-") + "</td>"
                + "<td>" + (consulta.motivo || "-") + "</td>"
                + "<td><span class='consulta-badge " + estadoClase(consulta.estado) + "'>" + (consulta.estado || "Pendiente") + "</span></td>"
                + "<td><button type='button' class='btn-editar'>Ver</button></td>";

            const btnVer = fila.querySelector("button");
            btnVer.addEventListener("click", function () {
                renderDetalle(consulta);
            });

            tbody.appendChild(fila);
        });

        if (!consultas.length) {
            detalle.innerHTML = "<p class='detalle-vacio'>Aun no hay consultas para revisar.</p>";
        }
    }

    btnLogout.addEventListener("click", function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "tienda.html";
    });

    render();
})();
