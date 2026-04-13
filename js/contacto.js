(function () {
    const CONSULTAS_KEY = "tienda_consultas_contacto_2026";
    const CONSULTAS_CORRELATIVO_KEY = "tienda_consultas_correlativo_2026";
    const form = document.getElementById("contacto-form");
    const feedback = document.getElementById("contacto-feedback");
    const mensaje = document.getElementById("contacto-mensaje");

    if (!form || !feedback || !mensaje) {
        return;
    }

    let esResetProgramatico = false;

    function leerConsultas() {
        try {
            const raw = localStorage.getItem(CONSULTAS_KEY);
            const consultas = raw ? JSON.parse(raw) : [];
            return Array.isArray(consultas) ? consultas : [];
        } catch (error) {
            return [];
        }
    }

    function guardarConsultas(consultas) {
        localStorage.setItem(CONSULTAS_KEY, JSON.stringify(consultas));
    }

    function siguienteCorrelativoConsulta() {
        const actual = Number(localStorage.getItem(CONSULTAS_CORRELATIVO_KEY) || 0);
        const siguiente = actual + 1;
        localStorage.setItem(CONSULTAS_CORRELATIVO_KEY, String(siguiente));
        return siguiente;
    }

    function codigoConsulta(numero) {
        return "C-" + String(numero).padStart(5, "0");
    }

    function mostrarFeedback(texto, esError) {
        feedback.textContent = texto;
        feedback.classList.add("visible");
        feedback.style.borderColor = esError ? "#ff4d7a" : "var(--accent)";
        feedback.style.background = esError
            ? "rgba(255, 77, 122, 0.15)"
            : "linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(157, 78, 221, 0.08))";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const mensajeTexto = String(mensaje.value || "").trim();
        if (mensajeTexto.length < 15) {
            mostrarFeedback("Tu mensaje debe tener al menos 15 caracteres.", true);
            mensaje.focus();
            return;
        }

        if (!form.checkValidity()) {
            mostrarFeedback("Revisa los campos obligatorios antes de enviar.", true);
            form.reportValidity();
            return;
        }

        const datos = new FormData(form);
        const correlativo = siguienteCorrelativoConsulta();

        const consulta = {
            id: "consulta_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            correlativo: correlativo,
            codigo: codigoConsulta(correlativo),
            nombre: String(datos.get("nombre") || "").trim(),
            email: String(datos.get("email") || "").trim(),
            telefono: String(datos.get("telefono") || "").trim(),
            motivo: String(datos.get("motivo") || "").trim(),
            mensaje: mensajeTexto,
            preferencia: String(datos.get("preferencia") || "").trim(),
            estado: "Pendiente",
            creadoEn: Date.now(),
            respuestas: []
        };

        const consultas = leerConsultas();
        consultas.push(consulta);
        guardarConsultas(consultas);

        mostrarFeedback("Consulta enviada con exito. Codigo: " + consulta.codigo + ".", false);
        esResetProgramatico = true;
        form.reset();
        esResetProgramatico = false;
    });

    form.addEventListener("reset", function () {
        if (esResetProgramatico) {
            return;
        }
        feedback.classList.remove("visible");
        feedback.textContent = "";
    });
})();
