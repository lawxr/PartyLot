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

## 2. Decisiones tomadas

1. **Escenario según el tema.** Con modo oscuro activo se ve el escenario oscuro del video; con modo claro, una variante crema con la misma estructura, tamaños y movimiento. Los componentes solo usan tokens `--stage-*`, que cambian con el tema.
2. **Premiar vive solo en el Party Pot.** Se elimina de Games (botón, aviso, modal) y de Who's Most Likely / Trivia.
3. **El resultado se abre con un botón "Ver resultado".** Nada se bloquea esperando a los demás.

## 3. Tokens y base visual (Fase 0)

Agregar a `globals.css`. Los valores claros van en `:root`, los oscuros en `.dark` (el proyecto ya usa `@custom-variant dark`), y nunca hay hex sueltos en los componentes:

| Token | Claro (`:root`) | Oscuro (`.dark`, igual al video) |
|---|---|---|
| `--stage-bg` | `radial #FFFDF8 → #F7F2E8` | `radial #2b2309 → #0e0c09` (nunca `#000`) |
| `--stage-card` | `#FFFDF8` | `rgba(255,255,255,.07)` |
| `--stage-card-border` | `rgba(23,21,18,.08)` | `rgba(255,255,255,.09)` |
| `--stage-text` | `#171512` | `#fff8e6` |
| `--stage-muted` | `#6F6A62` | `rgba(255,255,255,.6)` |
| `--stage-track` | `rgba(23,21,18,.08)` | `rgba(255,255,255,.1)` |
| `--stage-ring-outline` | `#171512` | `transparent` |
| `--game-orange` | `#ff7a3d` | `#ff7a3d` |

El amarillo `--party-yellow` y su texto oscuro son iguales en los dos temas, así que "seleccionado = amarillo" se ve idéntico. Lo que cambia en claro: las tarjetas llevan borde y sombra suave en vez de transparencia, y el aro del ganador suma un contorno oscuro de 2px (amarillo sobre crema pierde contraste).

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
- Eliminar: `Coins`, `Sparkles`, saldo MON, botón morado y su `RewardWinnerModal`, textos "Party Pot (Monad)", "Social Graph". En desktop, sin sidebar: el escenario centrado y el catálogo como pestañas arriba.

### 4.2 `WhosMostLikely`
- Cabecera → `GameEyebrow`. Pregunta: 31px/700, interlineado 1.08, sin tarjeta ni icono de rayo.
- Participantes: cuadrícula **2 columnas** de `FriendVoteCard`. Con más de 4 personas, 2 columnas con scroll vertical interno (no 3 avatares chicos). Máximo visible sin scroll: 4; el resto debajo.
- Al votar: la tarjeta se llena de amarillo con rebote (`scale 1 → 0.93 → 1.04 → 1`, 0.28s), check negro y onda de toque. El confeti de 45 partículas se quita aquí y se mueve al resultado.
- Contador `n of N voted` en vivo (ver Fase 3 para el dato).
- Pie: "Anterior" y "Omitir" como botones fantasma de ancho completo; los puntos de progreso se quedan, pero dentro del `GameEyebrow` (`1/5`).
- Botón **"Ver resultado"** (amarillo, ancho completo) en el pie, junto a "Omitir". Está deshabilitado mientras no haya votos en la pregunta y muestra el contador (`Ver resultado · 3`). Se puede abrir en cualquier momento, y el resultado trae "Seguir votando" para volver sin perder nada. Si llegan votos nuevos con el resultado abierto, las barras se actualizan en vivo.
- Nueva pantalla de **resultado** (`WinnerReveal` + 4 `VoteBar`): entra con `translateX 120px → 0` (0.3s, `out4`), el ganador crece con `back` (0.4s), las barras se llenan en cascada (0.7s, 50ms entre ellas) y el confeti sale desde el avatar.
- Quitar el aviso morado "¿Quieres premiar…?" y el modal de recompensa. En un empate, `WinnerReveal` muestra los avatares empatados juntos.

### 4.3 `ThisOrThat`
- Quitar naipes: coronas, rayos, esquinas invertidas, borde interior ámbar, fuentes mono.
- Dos `PickBlock` apilados (A naranja, B amarillo) con círculo **VS** (`#0e0c09`, borde blanco 4px) en el centro. Eso también arregla el desborde horizontal de dos cartas en pantallas de 360px.
- Al elegir: el bloque elegido se agranda (`scale 1.03`) con un aro blanco de 6px; el otro baja a 55% de opacidad; después aparecen los porcentajes (`36%` / `64%`) que ya calcula `percentA/percentB`.
- Mantener el gesto de deslizar (`drag="x"`) pero **con botones visibles equivalentes** (hoy "Votar A/B" están abajo en pequeño). Los dos bloques son los botones.
- `data-disable-swipe-back` se mantiene.

### 4.4 `CrewTrivia`
- Mismo escenario y `GameEyebrow`. Opciones como tarjetas verticales de ancho completo (`FriendVoteCard` en variante texto). Correcta = amarillo con check; incorrecta = atenuada. Explicación en una tarjeta `--stage-card`. Quitar el "Lore check" con emoji y el botón "Premiar".

### 4.5 Premiar (solo en Party Pot)
- Se quita `RewardWinnerModal` de `GamesView`, `WhosMostLikely` y `CrewTrivia`.
- En `PartyPotView` queda una acción "Premiar a alguien" con el selector de miembro y de monto. Los montos se muestran en moneda local; MON y el explorador solo en "Detalles técnicos" (según el plan de limpieza).
- Opcional, para que no se pierda el vínculo con el juego: guardar en el store el ganador del último resultado (`lastGameWinner`) y que el Party Pot lo proponga como destinatario por defecto. No hay botón en Games.

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
- Verificar contraste en **los dos temas**: texto sobre tarjeta ≥ 4.5:1; texto oscuro sobre amarillo ≥ 10:1; `--stage-muted` solo ≥ 14px. El naranja de This or That lleva texto `#1c0d04` en ambos.
- El tema se lee de la clase `dark` que ya activa `app/page.tsx`; sin lógica extra en los componentes.

## 8. Fases

| Fase | Entregable | Cómo se comprueba | Estado |
|---|---|---|---|
| 0. Base | Tokens `--stage-*` claro/oscuro, `GameStage`, `GameEyebrow`, `FriendVoteCard`, `PickBlock`, `VoteBar`, `WinnerReveal`, `GameProgress` | `npm run typecheck` y suite `game-stage-primitives.test.ts` pasando | **[COMPLETADA]** |
| 1. Who's Most Likely | Votación 2×2, botón "Ver resultado", resultado con barras, empate y confeti | Suite `whos-most-likely-ranking.test.ts` pasando, 0 violaciones slop | **[COMPLETADA]** |
| 2. This or That | Bloques de color + VS + porcentajes tras votar, sin naipes viejos | `PickBlock` interactivo con halo blanco, porcentajes y botones | **[COMPLETADA]** |
| 3. Contenedor y Trivia | `GamesView` sin sidebar ni jerga, selector por pestañas, Trivia con tokens de stage | `GamesView` centrado mobile-first, pruebas de integración en verde | **[COMPLETADA]** |
| 4. Party Pot | "Premiar a alguien" en `PartyPotView`, `RewardWinnerModal` fuera de Games | 0 referencias a `RewardWinnerModal` en juegos; disponible en Pot | **[COMPLETADA]** |
| 5. Datos y pulido | Contador en vivo ("n votes"), `prefers-reduced-motion`, `aria-live`, `check-slop` en verde | 28 suites / 238 tests en verde, `typecheck` 0 errores, 0 slop | **[COMPLETADA]** |

Orden recomendado: 0 → 1 → 2 (los dos juegos que salen en el video) → 3 → 4 → 5. La Fase 4 puede ir en paralelo a la 3, porque toca otro archivo.

## 9. Riesgos

- **Choque con el otro agente:** `GamesView`, `WhosMostLikely` y `ThisOrThat` ya tienen cambios sin commit de su limpieza (emojis, jerga). Empezar la Fase 1 solo cuando esa rama esté integrada, o trabajar en una rama aparte y rebasar.
- **Estado de pruebas:** `tests/unit/games-view.test.ts` existe; cualquier cambio de estructura en `GamesView` debe actualizar sus selectores en el mismo cambio.
- **Rendimiento del confeti:** `canvas-confetti` ya está instalado; usar una sola instancia y `disableForReducedMotion: true`.
- **Dos escenas distintas:** el video mezcla pantallas de teléfono con titulares gigantes. Esos titulares ("PLAY.", "ROAST YOUR CREW.") son de marketing y no van en la app.
