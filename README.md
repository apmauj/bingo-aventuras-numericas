# 🎲 Bingo Aventuras Numéricas

> **La Isla del Bingo Mágico** — Un juego educativo de bingo para niños y niñas de 6 a 8 años

![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![Estado](https://img.shields.io/estado-activo-green)

## 📖 Descripción

Bingo Aventuras Numéricas es un juego de bingo educativo diseñado para el aula. Los docentes crean una sala desde su computadora (pantalla grande) y los estudiantes se unen desde sus tablets o celulares. El juego combina:

- **Reconocimiento de números** (0-200, configurable)
- **Comparación numérica** (mayor, menor, igual)
- **Pares e impares** — discriminación de paridad
- **Decenas** — reconocimiento de agrupaciones por decena
- **Secuencias** — ¿qué viene antes o después?
- **Atención y escucha** activa
- **Motivación social** a través del juego en grupo

## 🎮 Modos de Juego

| Modo | Emoji | Descripción |
|------|-------|-------------|
| Clásico | 🎯 | Números aleatorios del rango configurado |
| Comparación | 📐 | ¿El número es mayor, menor o igual que otro? |
| Pares | 🔵 | Solo números pares |
| Impares | 🔴 | Solo números impares |
| Decenas | 🔟 | Se canta una decena, el alumno marca cualquier número de esa decena |
| Secuencia | ➡️ | ¿Qué viene antes o después de un número dado? |

## 📏 Tamaños de Cartón

| Tamaño | Complejidad | Edad sugerida |
|--------|-------------|----------------|
| 3×3 | Inicial | 6+ años |
| 4×4 | Intermedio | 7+ años |
| 5×5 | Avanzado | 8+ años |
| 6×6 | Experto (tablets/notebooks) | 8+ años |

Cada tamaño muestra dinámicamente la cantidad de números necesarios. Los tamaños no viables para el rango/modo seleccionado se muestran grisados e inhabilitados, previniendo configuraciones imposibles.

## ⭐ Estrella Central (Celda Libre)

- Disponible solo en tableros con casilla central (3×3, 5×5)
- Toggle **CON ESTRELLA** / **SIN ESTRELLA** para que el docente decida
- Por defecto: activada en tableros impares, desactivada en pares
- Se muestra como ⭐ en el cartón

## 🏗️ Arquitectura

```
bingo-aventuras-numericas/
├── src/                          # Frontend Next.js 16
│   ├── app/
│   │   ├── page.tsx              # Página principal — state machine del juego
│   │   ├── layout.tsx            # Layout con metadata y fuentes
│   │   └── globals.css           # Estilos globales (uppercase para niños)
│   ├── components/bingo/
│   │   ├── MasterCreate.tsx      # Crear sala (modo, cartón, rango, estrella)
│   │   ├── MasterLobby.tsx       # Lobby del docente con QR y jugadores
│   │   ├── MasterGame.tsx        # Pantalla de juego del docente
│   │   ├── StudentJoin.tsx       # Ingreso del estudiante (código, nombre, avatar)
│   │   ├── StudentLobby.tsx      # Espera del estudiante
│   │   ├── StudentGame.tsx       # Pantalla de juego del estudiante
│   │   ├── BingoCard.tsx         # Cartón de bingo interactivo (responsive)
│   │   ├── NumberDisplay.tsx     # Número cantado (soporta todos los modos)
│   │   ├── RankingBoard.tsx      # Tabla de posiciones
│   │   ├── ResultsScreen.tsx     # Pantalla de resultados con podio
│   │   ├── PipoMascot.tsx        # Mascota Pipo (6 estados de ánimo)
│   │   ├── ConfettiEffect.tsx    # Confeti al hacer BINGO
│   │   ├── SoundFX.ts            # Efectos de sonido + TTS (Web Audio + Speech API)
│   │   └── ...                   # Otros componentes
│   ├── types/bingo.ts            # Tipos TypeScript del juego
│   ├── hooks/useSocket.ts        # Hook de conexión Socket.io con reconexión
│   └── lib/socket-events.ts      # Constantes de eventos cliente/servidor
├── mini-services/bingo-server/   # Backend Socket.io (Bun + TypeScript)
│   ├── index.ts                  # Servidor Express + Socket.io (puerto 3003)
│   └── src/
│       ├── types.ts              # Tipos compartidos del backend
│       ├── socket.ts             # Handlers de eventos (crear, unir, jugar, reconectar)
│       ├── rooms.ts              # Gestión de salas y jugadores
│       ├── game.ts               # Lógica del juego (validar, detectar línea/bingo)
│       └── cards.ts              # Generación de cartones por modo
├── launcher.sh                   # Script para iniciar ambos servicios
└── start.sh                      # Script alternativo de inicio
```

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Bun, Express, Socket.io (mini-service en puerto 3003) |
| **Backend deploy** | Render (gratuito) — Socket.io + Express |
| **Frontend deploy** | GitHub Pages — estático, sin servidor |
| **Audio** | Web Audio API (efectos sintetizados) + Web Speech API (TTS en español) |
| **Tiempo real** | Socket.io con reconexión automática y restauración de estado |

### Flujo de Datos

1. El docente crea una sala → servidor genera código de 4 caracteres
2. Los estudiantes se unen con código + nombre + avatar (30 animales)
3. El docente inicia la partida → se generan cartones únicos para cada jugador
4. El docente canta números → se pronuncian en voz alta (TTS) + sonido
5. Los estudiantes marcan números → el servidor valida y otorga puntos
6. Línea completada: +50 pts | BINGO: +200 pts
7. Si un estudiante pierde conexión, puede reconectarse y continuar con su cartón y puntaje

## 🚀 Quick Start

### Requisitos

- Node.js 18+ o Bun
- npm o bun

### Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone git@github.com:apmauj/bingo-aventuras-numericas.git
   cd bingo-aventuras-numericas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   cd mini-services/bingo-server && npm install && cd ../..
   ```

3. **Iniciar los servicios**
   ```bash
   # Terminal 1 — Frontend
   npm run dev

   # Terminal 2 — Backend
   cd mini-services/bingo-server && npm run dev
   ```

4. **Abrir el juego**
   - Frontend: `http://localhost:3000`
   - Backend health check: `http://localhost:3003/health`

## 🐼 Pipo, la Mascota

Pipo es un panda adorable que acompaña a los niños durante todo el juego. Tiene 6 estados de ánimo:

| Estado | Cuándo aparece |
|--------|----------------|
| 😴 Durmiendo | Pantalla de "despertando servidor" |
| 🥱 Despertando | Animación de conexión |
| 😊 Feliz | Selección de rol, lobby |
| 🤔 Pensando | Respuesta incorrecta |
| 💪 Animando | Durante el juego |
| 🎉 Celebrando | Línea completada, BINGO |

## 🔊 Audio y Voz

El juego utiliza tecnologías nativas del navegador, sin archivos de audio externos:

- **Web Audio API**: Efectos de sonido sintetizados (correcto, incorrecto, línea, bingo, nuevo número, jugador unido)
- **Web Speech API (TTS)**: Pronunciación de cada número cantado en español (es-ES), a velocidad lenta (0.8) y tono amigable (1.2) para niños
- **Resume Audio**: Compatible con dispositivos móviles que requieren gesto de usuario para activar audio

## 📊 Sistema de Puntos

| Acción | Puntos |
|--------|--------|
| Marcar número correcto (clásico/pares/impares/decenas)	| +10 |
| Responder correctamente secuencia (1er intento)	| +10 |
| Responder correctamente secuencia (2do intento)	| +8 |
| Responder correctamente secuencia (3er intento+)	| +5 |
| Responder correctamente comparación (1er intento)	| +10 |
| Responder correctamente comparación (2do intento+)	| +5 |
| Completar línea/columna/diagonal	| +50 |
| BINGO (cartón completo)	| +200 |

## 🔄 Reconexión

Si un estudiante pierde la conexión durante una partida:

1. Se muestra un toast "SE PERDIÓ LA CONEXIÓN. INTENTANDO RECONECTAR..."
2. Socket.io reintenta automáticamente (hasta 10 intentos, 1s entre intentos)
3. Al reconectar, se envía `client:rejoinRoom` con el código de sala y el ID del jugador
4. El servidor restaura el estado: cartón, celdas marcadas, puntaje y números cantados
5. Si no reconecta en 30 segundos, el jugador es eliminado de la partida

## 🧠 Principios de Diseño

- **Lenguaje positivo**: Nunca mensajes negativos. "¡Seguí intentando!" en vez de "Incorrecto"
- **Retroalimentación inmediata**: Cada acción tiene respuesta visual y sonora
- **Touch-friendly**: Targets mínimos de 44-48px para tablets
- **Texto en mayúsculas**: Mejora la legibilidad para niños de 6-8 años
- **Accesibilidad**: Contraste suficiente, `aria-labels`, `prefers-reduced-motion`
- **Validación proactiva**: Los tamaños de cartón no viables se grisán antes de crear la sala

## 📋 TODO — Features pendientes de portar desde la versión standalone

La versión original (HTML/CSS/JS vanilla) tiene algunas features que aún no fueron portadas a la versión Next.js:

- [x] **Texto flotante de puntos** — Al marcar correctamente, aparece "+10" o "+50" flotando junto a la casilla.
- [x] **Animación de score bounce** — El puntaje cuenta hacia arriba animado en vez de cambiar instantáneamente.
- [x] **Transiciones de pantalla** — Fade animado entre las distintas vistas del juego.
- [x] **Overlay de celebración de BINGO** — Pantalla completa con nombre del ganador (el confetti actual es sutil).
- [x] **Mensajes variados de ánimo** — Frases aleatorias de estímulo en vez de un único mensaje fijo por evento.
- [x] **Toggle de TTS** — Botón para que el docente/estudiante pueda silenciar la pronunciación de números.
- [ ] **Deploy a producción** — Configuración para Render (backend) + Vercel/GitHub Pages (frontend).

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT — Ver [LICENSE](LICENSE) para más detalles.

---

Hecho con ❤️ para la educación
