// Catálogo de juegos populares para la tienda
const JUEGOS_POR_DEFECTO = [
    // Resident Evil
    { nombre: "Resident Evil 4 Remake", plataformas: ["PC", "PS4-PS5"], imagen: "https://raw.githubusercontent.com/steamgrid/steamgriddb/master/games/3/3.jpg", color: "#8B0000" },
    { nombre: "Resident Evil 7", plataformas: ["PC", "PS4-PS5"], imagen: "🎮", color: "#A00000" },
    { nombre: "Resident Evil 8 (Village)", plataformas: ["PC", "PS4-PS5"], imagen: "🏚️", color: "#B00000" },
    { nombre: "Resident Evil Purgatory", plataformas: ["PS4-PS5"], imagen: "👹", color: "#C00000" },
    
    // Action/Adventure
    { nombre: "Dragon Age: The Veilguard", plataformas: ["PC", "PS4-PS5"], imagen: "🐉", color: "#1a3a52" },
    { nombre: "Final Fantasy VII Rebirth", plataformas: ["PS4-PS5"], imagen: "✨", color: "#0066ff" },
    { nombre: "Ghost of Tsushima", plataformas: ["PS4-PS5"], imagen: "👻", color: "#2d5016" },
    { nombre: "Elden Ring", plataformas: ["PC", "PS4-PS5"], imagen: "👑", color: "#FFD700" },
    { nombre: "Baldur's Gate 3", plataformas: ["PC", "PS4-PS5"], imagen: "🧙", color: "#4B0082" },
    { nombre: "Palworld", plataformas: ["PC", "PS4-PS5"], imagen: "🦁", color: "#FF6B6B" },
    
    // Sports/Racing
    { nombre: "F1 2025", plataformas: ["PC", "PS4-PS5"], imagen: "🏎️", color: "#FF0000" },
    { nombre: "EA Sports FC 25", plataformas: ["PC", "PS4-PS5"], imagen: "⚽", color: "#00AA00" },
    { nombre: "Gran Turismo 7", plataformas: ["PS4-PS5"], imagen: "🏁", color: "#1E90FF" },
    
    // Strategy/RPG
    { nombre: "Black Myth: Wukong", plataformas: ["PC", "PS4-PS5"], imagen: "🐵", color: "#FFB300" },
    { nombre: "Metaphor: ReFantazio", plataformas: ["PC", "PS4-PS5"], imagen: "🎭", color: "#9370DB" },
    { nombre: "Persona 5 Royal", plataformas: ["PC", "PS4-PS5"], imagen: "🎷", color: "#8B0000" },
    
    // Indie/Others
    { nombre: "Hades II", plataformas: ["PC", "PS4-PS5"], imagen: "🔥", color: "#000000" },
    { nombre: "Tekken 8", plataformas: ["PC", "PS4-PS5"], imagen: "👊", color: "#33CCFF" },
    { nombre: "Silent Hill 2 Remake", plataformas: ["PC", "PS4-PS5"], imagen: "🌫️", color: "#4a4a4a" },
    { nombre: "Metal Gear Solid Δ: Snake Eater", plataformas: ["PC", "PS4-PS5"], imagen: "🐍", color: "#556B2F" },
];

const DESCRIPCIONES_JUEGOS = {
    "Resident Evil 4 Remake": "Survival horror de accion donde Leon enfrenta una aldea infectada en una mision de rescate con combate intenso y enfoque moderno.",
    "Resident Evil 7": "Experiencia de terror en primera persona con exploracion, puzles y una atmosfera opresiva centrada en la mansión Baker.",
    "Resident Evil 8 (Village)": "Secuela de RE7 que mezcla horror y accion en un pueblo aislado con jefes memorables y gran variedad de escenarios.",
    "Resident Evil Purgatory": "Spin-off de accion y horror centrado en enfrentamientos contra criaturas mutadas con ritmo rapido y enfoque cooperativo.",
    "Dragon Age: The Veilguard": "RPG de fantasia con decisiones narrativas, companeros con historias propias y combates tacticos en tiempo real.",
    "Final Fantasy VII Rebirth": "RPG narrativo de gran escala que combina exploracion, combate dinamico y una historia emotiva en un mundo abierto.",
    "Ghost of Tsushima": "Aventura de accion samurai en mundo abierto, con sigilo, duelos precisos y una direccion artistica inspirada en el cine japones.",
    "Elden Ring": "RPG de accion desafiante en un mundo abierto oscuro, con libertad de exploracion, builds variadas y jefes exigentes.",
    "Baldur's Gate 3": "RPG tactico por turnos basado en D&D, con decisiones profundas, multiples rutas y una narrativa altamente reactiva.",
    "Palworld": "Juego de supervivencia y captura de criaturas con crafteo, construccion de bases y combate en un mundo abierto.",
    "F1 2025": "Simulacion de Formula 1 con manejo tecnico, estrategia de carrera y modos competitivos online y carrera profesional.",
    "EA Sports FC 25": "Simulador de futbol con modos competitivos, equipos oficiales y mejoras en jugabilidad para partidos mas fluidos.",
    "Gran Turismo 7": "Simulador de conduccion con fisicas realistas, gran variedad de autos y eventos para progresar como piloto.",
    "Black Myth: Wukong": "Accion RPG inspirado en la mitologia china con combates exigentes, transformaciones y jefes espectaculares.",
    "Metaphor: ReFantazio": "RPG de fantasia con identidad estilizada, narrativa politica y combate estrategico con gestion del tiempo.",
    "Persona 5 Royal": "RPG por turnos con vida estudiantil, exploracion de palacios y narrativa centrada en relaciones y dilemas sociales.",
    "Hades II": "Roguelike de accion con progreso constante, combates rapidos y gran rejugabilidad en partidas cortas e intensas.",
    "Tekken 8": "Juego de pelea competitivo con animaciones avanzadas, sistema agresivo de combate y foco en duelos online.",
    "Silent Hill 2 Remake": "Survival horror psicologico con narrativa profunda, atmosfera inquietante y exploracion en una ciudad envuelta en niebla.",
    "Metal Gear Solid Δ: Snake Eater": "Aventura de infiltracion con sigilo tactico, narrativa militar y supervivencia en entornos selvaticos.",
};

const STORAGE_JUEGOS_KEY = "tienda_catalogo_juegos_2026";

// Obtener catálogo desde localStorage o usar valores por defecto
function obtenerCatalogo() {
    try {
        const raw = localStorage.getItem(STORAGE_JUEGOS_KEY);
        const base = raw ? JSON.parse(raw) : JUEGOS_POR_DEFECTO;

        return base.map(function (juego) {
            const descripcion = juego.descripcion
                || DESCRIPCIONES_JUEGOS[juego.nombre]
                || "Sin descripcion disponible.";

            return {
                ...juego,
                descripcion: descripcion,
            };
        });
    } catch (error) {
        return JUEGOS_POR_DEFECTO.map(function (juego) {
            return {
                ...juego,
                descripcion: DESCRIPCIONES_JUEGOS[juego.nombre] || "Sin descripcion disponible.",
            };
        });
    }
}

// Guardar catálogo en localStorage
function guardarCatalogo(juegos) {
    localStorage.setItem(STORAGE_JUEGOS_KEY, JSON.stringify(juegos));
}

// Función para obtener juegos filtrados por plataforma
function obtenerJuegosPorPlataforma(plataforma) {
    const catalogo = obtenerCatalogo();
    return catalogo
        .filter(juego => juego.plataformas.includes(plataforma))
        .map(juego => juego.nombre)
        .sort();
}

// Función para obtener todos los nombres únicos
function obtenerTodosLosJuegos() {
    const catalogo = obtenerCatalogo();
    return catalogo
        .map(juego => juego.nombre)
        .sort();
}

// Agregar un juego nuevo al catálogo
function agregarJuegoAlCatalogo(nombre, plataformas, imagen = "🎮", color = "#00d4ff", descripcion = "") {
    const catalogo = obtenerCatalogo();
    
    // Verificar si el juego ya existe
    const existe = catalogo.some(j => j.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
        return false;
    }
    
    catalogo.push({
        nombre: nombre,
        plataformas: Array.isArray(plataformas) ? plataformas : [plataformas],
        imagen: imagen,
        color: color,
        descripcion: String(descripcion || DESCRIPCIONES_JUEGOS[nombre] || "Sin descripcion disponible.")
    });
    
    guardarCatalogo(catalogo);
    return true;
}

// Eliminar un juego del catálogo
function eliminarJuegoDelCatalogo(nombre) {
    const catalogo = obtenerCatalogo();
    const indexInicial = catalogo.length;
    const catalogoFiltrado = catalogo.filter(j => j.nombre.toLowerCase() !== nombre.toLowerCase());
    
    if (catalogoFiltrado.length < indexInicial) {
        guardarCatalogo(catalogoFiltrado);
        return true;
    }
    
    return false;
}
