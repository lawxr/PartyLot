# Plan: llevar la interfaz de juegos del trailer a la app

> Fuente visual: `trailer-film/compositions/act2-games.html` (pantallas `.g`, `.wml`, `.res`, `.tot`) y `act1-chat.html` (`.game`, lobby).
> Código actual: `src/components/views/GamesView.tsx`, `src/components/games/{WhosMostLikely,ThisOrThat,CrewTrivia,RewardWinnerModal}.tsx`.
> Alcance: solo la UI y su coreografía. No cambia la lógica de votos ni de Supabase, salvo lo que se marca en la Fase 3.

## 1. Diferencias entre lo que gustó y lo que hay hoy

| | Trailer | App actual |
|---|---|---|
| Superficie | Escenario **oscuro cálido** (`radial #2b2309 → #0e0c09`), una sola columna tipo teléfono | Fondo crema claro, tarjetas de vidrio, sidebar en desktop |
| Jerarquía | Etiqueta amarilla en mayúsculas → pregunta grande (31px/700) → 4 tarjetas grandes | Título + subtítulo + tarjeta de pregunta con rayo + 6 avatares pequeños en 3 columnas |
| Voto | Tarjeta 168px con avatar de 86px; al votar **se llena toda de amarillo** con check negro | Avatar de 80px con anillo amarillo y badge de 20px |
| Progreso | `0 of 14 voted · Tap a friend to vote` (contador vivo) | 10 puntos y `n / total` (progreso de preguntas, no de personas) |
| Resultado | Pantalla **"The crew has spoken"**: ganador con anillo amarillo, nombre grande, barras (la ganadora en amarillo), confeti | No existe: el voto solo suma y aparece un aviso para premiar |
| This or That | Dos bloques de color a pantalla casi completa (naranja `#ff7a3d` y amarillo), círculo VS, el elegido se agranda y el otro se atenúa | Dos cartas de naipe con coronas, esquinas invertidas, tipografía mono y bordes interiores |
| Marca | Un solo acento (amarillo), sin morado | Botón y avisos morados `#836EF9` (3 archivos), MON y "Monad" en pantalla |
| Movimiento | Pulsación 0.95, el elegido rebota con `back`, barras que se llenan, confeti desde el ganador | `whileTap` y confeti genérico de 45 partículas al votar |

La parte del trailer que **no** se traslada: el 3D, la proyección en perspectiva, los tres teléfonos a la vez y el leaderboard con puntos (la app no calcula puntos hoy, ver Fase 5).

## 2. Decisiones que necesito de ti antes de empezar

1. **Escenario oscuro en ambos temas.** Es lo que se ve en el video. `DESIGN.md` permite pantallas inmersivas para Games, pero dice "bright by default". Recomiendo: Games y Recap siempre en el escenario oscuro cálido (nunca negro puro), y el resto de la app sigue claro.
2. **Quitar el flujo de recompensa de la vista de juegos** (botón morado "Premiar", MON, modal con explorador). Ya está marcado como jerga cripto en el plan de limpieza. Recomiendo sacarlo de esta pantalla y dejar "Premiar" dentro del Party Pot.
3. **Resultado por ronda:** ¿se muestra después de que vote todo el mundo, o cuando alguien toca "Ver resultado"? Recomiendo lo segundo, porque en una fiesta no todos votan y no se debe bloquear a nadie.

## 3. Tokens y base visual (Fase 0)

Agregar a `globals.css` (junto a los tokens que ya existen, sin hex sueltos en los componentes):

```css
--stage-top:    #2b2309;   /* radial superior del escenario */
--stage-bottom: #0e0c09;   /* nunca #000 */
--stage-card:   rgba(255,255,255,.07);
--stage-card-border: rgba(255,255,255,.09);
--stage-text:   #fff8e6;
--stage-muted:  rgba(255,255,255,.6);
--game-orange:  #ff7a3d;   /* opción A de This or That */
```

Componentes nuevos en `src/components/games/stage/`:

| Componente | Qué hace | Equivale en el video |
|---|---|---|
| `GameStage` | Fondo radial, ancho máx. ~430px centrado, borde de seguridad, `min-h-dvh`. En desktop va centrado con la foto de la fiesta desenfocada detrás | `.g` + fondo de `.bg` |
| `GameEyebrow` | Etiqueta amarilla en mayúsculas con tracking (`WHO'S MOST LIKELY? · 1/5`) y avatar propio a la derecha | `.top` |
| `FriendVoteCard` | Tarjeta 2×2: avatar 86px + nombre; estado seleccionado = fondo amarillo, texto oscuro, check | `.card` / `.card.sel` |
| `VoteBar` | Fila avatar + barra + porcentaje; la ganadora en amarillo | `.res .br` |
| `WinnerReveal` | Anillo amarillo de 6px con halo, nombre 50px, "9 of 14 votes" | `.res .who/.nm/.vt` |
| `PickBlock` | Bloque grande de color para This or That con estados normal / elegido / atenuado | `.tot .half` |
| `GameProgress` | `Tap a friend to vote` + contador "n of N voted" con `aria-live="polite"` | `.foot` |

Reutilizar lo que ya existe: `Avatar`, `PressableCard` (para que las tarjetas sean botones accesibles) y los tokens de Fase 0 del otro agente. No usar `GlassPanel` en el escenario.

## 4. Cambios por pantalla

### 4.1 `GamesView` (lobby y contenedor)
- Reemplazar el banner de fiesta + pastillas + sidebar de "catálogo" por: `GameStage` → cabecera mínima (volver, nombre de la fiesta, avatares de quién está jugando) → selector de juego como **tres pestañas** con el mismo lenguaje (amarillo activo).
- Lobby de la ronda (el de `act1` al tocar Play): etiqueta `GAME NIGHT · ROUND 1`, título del juego en 50px y un anillo de avatares. Se usa como pantalla de "Empezar" cuando no hay votos aún; después de la primera ronda se salta.
- Eliminar: `Coins`, `Sparkles`, saldo MON, botón morado, textos "Party Pot (Monad)", "Social Graph". En desktop, sin sidebar: el escenario centrado y el catálogo como pestañas arriba.

### 4.2 `WhosMostLikely`
- Cabecera → `GameEyebrow`. Pregunta: 31px/700, interlineado 1.08, sin tarjeta ni icono de rayo.
- Participantes: cuadrícula **2 columnas** de `FriendVoteCard`. Con más de 4 personas, 2 columnas con scroll vertical interno (no 3 avatares chicos). Máximo visible sin scroll: 4; el resto debajo.
- Al votar: la tarjeta se llena de amarillo con rebote (`scale 1 → 0.93 → 1.04 → 1`, 0.28s), check negro y onda de toque. El confeti de 45 partículas se quita aquí y se mueve al resultado.
- Contador `n of N voted` en vivo (ver Fase 3 para el dato).
- Pie: "Anterior" y "Omitir" como botones fantasma de ancho completo; los puntos de progreso se quedan, pero dentro del `GameEyebrow` (`1/5`).
- Nueva pantalla de **resultado** (`WinnerReveal` + 4 `VoteBar`): entra con `translateX 120px → 0` (0.3s, `out4`), el ganador crece con `back` (0.4s), las barras se llenan en cascada (0.7s, 50ms entre ellas) y el confeti sale desde el avatar.
- Quitar el aviso morado "¿Quieres premiar…?".

### 4.3 `ThisOrThat`
- Quitar naipes: coronas, rayos, esquinas invertidas, borde interior ámbar, fuentes mono.
- Dos `PickBlock` apilados (A naranja, B amarillo) con círculo **VS** (`#0e0c09`, borde blanco 4px) en el centro. Eso también arregla el desborde horizontal de dos cartas en pantallas de 360px.
- Al elegir: el bloque elegido se agranda (`scale 1.03`) con un aro blanco de 6px; el otro baja a 55% de opacidad; después aparecen los porcentajes (`36%` / `64%`) que ya calcula `percentA/percentB`.
- Mantener el gesto de deslizar (`drag="x"`) pero **con botones visibles equivalentes** (hoy "Votar A/B" están abajo en pequeño). Los dos bloques son los botones.
- `data-disable-swipe-back` se mantiene.

### 4.4 `CrewTrivia`
- Mismo escenario y `GameEyebrow`. Opciones como tarjetas verticales de ancho completo (`FriendVoteCard` en variante texto). Correcta = amarillo con check; incorrecta = atenuada. Explicación en una tarjeta `--stage-card`. Quitar el "💡 Lore check" y el botón morado "Premiar".

### 4.5 `RewardWinnerModal`
- Fuera del flujo de juegos (decisión 2). Si se conserva, vive en el Party Pot, con tokens de marca y sin MON/Monad en la UI.

## 5. Movimiento (framer-motion, no GSAP)

Valores tomados del video, para que se sienta igual:

| Momento | Duración / curva |
|---|---|
| Pulsar tarjeta | 0.2s, escala a 0.93 y vuelve |
| Seleccionar | 0.28s, `back` hasta 1.04 |
| Cambio de pantalla (votar → resultado) | 0.3s `easeOut` con `x: 120 → 0` |
| Barras | 0.7s `easeOut`, desfase 50ms |
| Ganador | 0.4s `back` |
| Confeti | una sola ráfaga de ~90 piezas, 2.4s, colores `#f0dc00 #fff8e6 #ff7a3d #171512` |

`prefers-reduced-motion`: sin rebote ni confeti; el cambio de estado se mantiene con un cambio de color y un fundido de 120ms.

## 6. Datos y lógica (solo lo necesario)

- **Contador "n of N voted":** `WhosMostLikelyQuestion.votes` guarda `memberId → conteo`, pero no quién votó. Opciones: (a) sumar los valores y mostrar "n votes" (sin cambios de esquema), o (b) añadir `voters: string[]` por pregunta y persistirlo en la sesión de juego. Empezar con (a); (b) si queremos "faltan por votar".
- **Ganador y porcentajes:** derivables de `votes` en el cliente. Sin cambios de backend.
- **Leaderboard del video (Sofi 2,400 pts):** no hay modelo de puntos. Dos caminos: no incluirlo, o definir puntos (1 por voto recibido + 10 por acertar en Trivia) y mostrarlos en el Recap. Recomiendo diferirlo.
- Quitar nombres fijos de relleno ("Ana", "Carlos", "Law") que `mockData.ts` y esas pantallas aún usan como ejemplos visibles.

## 7. Accesibilidad y responsive

- Todas las tarjetas son `<button>` (vía `PressableCard`) con `aria-pressed`; el contador y el ganador en una región `aria-live="polite"`.
- Contraste: texto crema sobre `--stage-bottom` ≥ 12:1; texto oscuro sobre amarillo ≥ 10:1; el gris `--stage-muted` solo para texto ≥ 14px.
- Objetivos táctiles ≥ 44px (las tarjetas miden 168px de alto).
- Probar 360×640, 390×844, 768 y 1440; el escenario nunca más ancho que ~430px.
- La variante clara para quien tenga el tema claro se descarta (ver decisión 1); si se decide lo contrario, los tokens `--stage-*` se duplican bajo `:root:not(.dark)`.

## 8. Fases

| Fase | Entregable | Cómo se comprueba |
|---|---|---|
| 0. Base | Tokens `--stage-*`, `GameStage`, `GameEyebrow`, `FriendVoteCard`, `PickBlock`, `VoteBar`, `WinnerReveal`, `GameProgress` + prueba visual de cada uno en un solo caso | `pnpm typecheck` y `pnpm lint`; captura de cada componente |
| 1. Who's Most Likely | Nueva votación 2×2 + resultado con barras y confeti | Prueba de unidad de ganador/porcentajes; captura del flujo en 390×844 |
| 2. This or That | Bloques de color + VS + porcentajes tras votar, con gesto y botones | Captura de estados (sin voto / A / B); prueba de que el swipe sigue sumando el voto correcto |
| 3. Datos | Contador en vivo (opción a) y, si se aprueba, `voters` | `tests/unit/games-view.test.ts` ampliado |
| 4. Contenedor y Trivia | `GamesView` sin sidebar ni jerga cripto, pestañas de juego, Trivia con el nuevo lenguaje | Captura en 360, 390, 768 y 1440; revisión de teclado |
| 5. Pulido | `prefers-reduced-motion`, `aria-live`, `check-slop` en verde, leaderboard (si se aprueba) | `pnpm release:check` y un re-audit con `$impeccable audit` sobre `GamesView` |

Orden recomendado: 0 → 1 → 2 (los dos juegos que salen en el video) → 4 → 3 → 5.

## 9. Riesgos

- **Choque con el otro agente:** `GamesView`, `WhosMostLikely` y `ThisOrThat` ya tienen cambios sin commit de su limpieza (emojis, jerga). Empezar la Fase 1 solo cuando esa rama esté integrada, o trabajar en una rama aparte y rebasar.
- **Estado de pruebas:** `tests/unit/games-view.test.ts` existe; cualquier cambio de estructura en `GamesView` debe actualizar sus selectores en el mismo cambio.
- **Rendimiento del confeti:** `canvas-confetti` ya está instalado; usar una sola instancia y `disableForReducedMotion: true`.
- **Dos escenas distintas:** el video mezcla pantallas de teléfono con titulares gigantes. Esos titulares ("PLAY.", "ROAST YOUR CREW.") son de marketing y no van en la app.
