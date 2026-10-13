# Auditoría: UI de juegos (implementación del plan del trailer)

Commits revisados: `39a9f3b` … `32cda2a`. Verificado con `tsc`, `eslint`, `vitest`, `scripts/check-slop.mjs`, lectura de código y capturas Playwright en 390×844, 360×640 y 1440×900, en claro/oscuro y en ES/EN, con 6 miembros de prueba.

## Veredicto

El resultado visual se parece al video y el flujo funciona. Pero hay un problema de integridad de votos y varios incumplimientos del plan. **No está listo para producción** hasta cerrar los P0/P1.

| Chequeo | Resultado |
|---|---|
| `pnpm typecheck` | OK |
| `pnpm test` | 238/238, pero los 2 tests nuevos casi no prueban nada (ver P1-4) |
| `check-slop` | 0 violaciones, pero el chequeo es demasiado estrecho (ver P1-5) |
| `pnpm lint` | **Fallaba** (48 errores, todos en carpetas que no son la app); corregido en esta auditoría |
| Errores de consola en juegos | Ninguno |

## P0: integridad de datos

**P0-1 · Se puede votar sin límite.** Medido en la app: 5 toques sobre la misma tarjeta en Who's Most Likely dan "**5 de 6 personas votaron**" y 5 votos (100%) para esa persona; en This or That, 3 toques extra pasan de 1 a 4 votos. `handleVote` llama a `voteWhosMostLikely` / `voteThisOrThat` en cada toque, y el store solo suma (no hay "un voto por persona", ni cambiar de voto ni quitar el anterior). Las tarjetas grandes y el confeti lo hacen más fácil de provocar por accidente, y el resultado queda en el Recap y en Supabase.
Corrección: guardar el voto del usuario por pregunta (`userVote` en Who's Most Likely, que ya existe en This or That) y, al votar de nuevo, restar el anterior y sumar el nuevo; ignorar el toque repetido sobre la misma opción. El contador "n de N" debe contar **personas** (`voters`), no la suma de votos.

## P1: incumplen el plan o la accesibilidad

**P1-1 · Idioma mezclado.** Texto fijo en español aunque la app esté en inglés: `GameProgress` ("X de N personas votaron"), `WinnerReveal` ("de", "votos"; y "THE CREW HAS SPOKEN" fijo en inglés), `VoteBar` ("votos"), `PickBlock` ("OPCIÓN A", "Toca para votar", "votos"), `ThisOrThat` ("voto registrado"), y `aria-label` en inglés fijo ("Vote for…", "Choose…"). Con la app en inglés, el resultado muestra "VOTE BREAKDOWN" junto a "5 votos (100%)". Faltan además plurales ("1 votos").
Corrección: pasar todo por `translations.ts` (claves `games.*`) y pluralizar.

**P1-2 · Texto amarillo ilegible en modo claro.** `GameEyebrow`, el título de la fiesta en `GamesView` y "THE CREW HAS SPOKEN" usan `text-party-yellow` sobre crema (`#F0DC00` sobre `#FFFDF8` ≈ **1.4:1**; el mínimo es 4.5:1). En las capturas claras casi no se leen. Corrección: token `--stage-accent-text` (ink `#171512` en claro, amarillo en oscuro).

**P1-3 · Doble cabecera y scroll de más.** `GamesView` ya dibuja flecha de volver + título + pestañas, y cada juego vuelve a dibujar su propio `GameEyebrow` con **otra flecha de volver**. Además `GameStage` fuerza `min-h-[100dvh]` dentro de `GamesView`, así que la página mide 972px en una pantalla de 844 (y 768 en 640): scroll vertical siempre, y "Ver resultado" queda debajo del pliegue. Corrección: un solo contenedor (`GameStage` en `GamesView`, juegos sin `GameStage` propio) y una sola flecha.

**P1-4 · Pruebas sin valor.** `game-stage-primitives.test.ts` solo comprueba que cada export es una función. `whos-most-likely-ranking.test.ts` **no importa código de la app**: reimplementa el `sort` dentro del test. Ninguna prueba cubre ganador, empate, porcentajes ni el voto repetido (P0-1). Corrección: extraer `rankVotes(friends, votes)` a `lib/games.ts` con pruebas reales (ganador, empate, 0 votos, porcentajes que suman 100) y una prueba de render de `FriendVoteCard`/`PickBlock`.

**P1-5 · `check-slop` da falsa seguridad.** Su regex de jerga cripto solo detecta `monad testnet|sponsored gas|faucet|ledger|onchain record|social graph reputation`. Sigue pasando con "MON", "Monad", "onchain" sueltos: hay **20 apariciones en `RewardWinnerModal`** ("RECOMPENSA ONCHAIN CONFIRMADA", "Confirmando en Monad…", "Transferir 0.50 MON", enlace al explorador). Ese modal se movió al Party Pot (cumple la decisión 2), pero lo que se movió es la versión con jerga, no la versión de consumidor del plan (montos en moneda local, detalles técnicos plegados). También conserva `#836EF9` morado en el confeti.
Corrección: ampliar la regex a `\b(MON|Monad|onchain|testnet)\b` en vistas de consumidor, con lista de excepciones explícita (`privacy`, `terms`, "Detalles técnicos"), y rehacer el modal.

**P1-6 · Se perdió el gesto de deslizar en This or That** (el plan decía conservarlo con botones visibles). Hoy solo hay toque; ya no existe `drag="x"`. Es un cambio de producto no acordado; confirmar si se acepta.

## P2

- **Modak en textos de lectura.** Los dilemas de This or That y el nombre del ganador usan `font-bubble` (Modak), que es la tipografía del logo. "AMANECER EN LA PLAYA" y "ROOFTOP A LAS 4AM" se leen mal; en el video usé Archivo Black. Usar `font-display` con peso 900.
- **Hex sueltos** en componentes nuevos: `#ff7a3d`, `#1c0d04`, `#0e0c09`, `#171512` en `PickBlock`, `FriendVoteCard`, `ThisOrThat`, y colores de confeti. El plan pedía tokens (`--game-orange` no existe en `globals.css`).
- **Aro blanco de 6px en `PickBlock`** casi no se ve sobre crema en modo claro; usar `--stage-ring-outline`.
- **Confeti en cada voto de This or That** (50 piezas por toque, con el P0-1 se acumula). El plan lo reservaba para el resultado.
- **Banner de cookies** tapa "Ver resultado" y "Siguiente dilema" en la primera visita (ya estaba en la auditoría original, P2-6; no se ha corregido).
- **Cuadrícula con scroll interno** (`max-h-[380px] overflow-y-auto`) más scroll de página: dos scrolls anidados con 6 o más personas.
- `useMemo` de `friendsToDisplay` depende de `partyMembers`, que se recrea cada render (aviso `react-hooks/exhaustive-deps`).
- `GamesView`: las dos ramas del ternario "en la sala/playing" son idénticas.
- `RewardWinnerModal.tsx` sigue viviendo en `components/games/` aunque ya solo lo usa el Party Pot.
- `lastGameWinner` (opcional en el plan) no se implementó; no es un defecto.

## Lo que está bien

- Tokens `--stage-*` en claro y oscuro (`globals.css`), con las mismas variables para ambos temas.
- Los 7 componentes de `stage/` existen con la API prevista; `FriendVoteCard`, `PickBlock` y `WinnerReveal` respetan `prefers-reduced-motion`; las tarjetas son `<button aria-pressed>`; `GameProgress` tiene `aria-live`.
- El flujo "Ver resultado" funciona como se decidió: deshabilitado sin votos, contador en el botón, "Seguir votando", y el resultado se actualiza al llegar votos; el empate muestra a los avatares juntos.
- "Premiar" salió de Games y está solo en el Party Pot; `GamesView` ya no tiene MON, morado ni la barra lateral.
- Sin emojis, sin fotos de Unsplash ni nombres falsos en la UI de juegos; `alert()` pasó de 2 a 0.

## Estado del resto de la app (vs. la auditoría inicial)

| Métrica | Antes | Ahora |
|---|---|---|
| Hex en `[#…]` | 2.256 | 1.604 |
| Colores Tailwind fuera de paleta | 163 | 83 |
| `isEs ?` en línea | 569 | 532 |
| `text-[8–10px]` | 138 | 74 |
| `Sparkles` | 39 | 21 |
| `alert()` | 2 | 0 |
| `aria-live` | 0 | 4 |
| `motion.div` con `onClick` | ~78 | 0 |
| Morado `#836EF9` | 3 archivos | 13 usos |
| Jerga MON/Monad/onchain (vistas) | 25 archivos | `PartyPotView` 47, `stats` 29, `PartyDetailView` 21, `RewardWinnerModal` 20, `SharedExperienceModal` 18, `TokenLogo` 10 |
| Fotos de Unsplash fuera de mock | 43 | 14 |

La mayor deuda sigue siendo la jerga cripto en Party Pot, Party Detail, stats y SharedExperience, y 532 ternarios de idioma que ya provocan los textos mezclados de P1-1.

## Orden sugerido

1. P0-1 (votos únicos) con pruebas reales, P1-4.
2. P1-3 (un solo contenedor) y P1-2 (contraste en claro).
3. P1-1 (i18n del módulo de juegos).
4. P1-5 (regex de `check-slop` + rehacer `RewardWinnerModal` con montos locales).
5. P1-6 (decidir sobre el gesto) y los P2.
6. Volver a auditar `GamesView`.

## Corregido durante la auditoría
 
- `eslint.config.mjs`: se añadieron `.agents`, `.claude`, `launch-film`, `trailer-film` y `brag-output*` a `globalIgnores`. `pnpm lint` ahora termina con 0 errores (14 avisos de variables sin usar en `src/`).

## Resuelto (Tareas T1–T8)

1. **P0-1 · Voto único por persona y servidor blindado (T1):**
   - Votos mapeados por identidad única en `voters: Record<string, string | 'A' | 'B'>`.
   - Lógica de conteos, ganadores, empates y porcentajes extraída a funciones puras en `src/lib/games.ts` (`applyVote`, `tally`, `votersCount`, `rank`, `winners`, `percentages`).
   - Servidor `/api/parties/games` valida token de Privy, procesa votos atómicos individuales con `actorId` verificado e ignora bloques forjados del cliente.
   - Pruebas unitarias dedicadas en `tests/unit/games-voting.test.ts` y `tests/unit/games-route-authorization.test.ts`.

2. **P1-3 · Un solo contenedor y cabecera unificada (T2):**
   - `GamesView` es el único dueño de `GameStage` y los controles de navegación.
   - Eliminados `GameStage` duplicados y flechas de volver duplicadas de `WhosMostLikely`, `ThisOrThat` y `CrewTrivia`.
   - Eliminado scroll anidado (`max-h-[380px] overflow-y-auto`) en la cuadrícula de participantes.
   - Sincronizado `--cookie-banner-h` para evitar que el banner de cookies tape acciones principales.

3. **P1-2 · Contraste y tokens en modo claro (T3):**
   - Creados tokens `--stage-accent-text`, `--stage-ring-outline`, `--stage-ink`, `--stage-vs`, `--game-orange`, `--game-orange-ink` en `:root`, `.dark` y `@theme`.
   - Eliminado `text-party-yellow` en textos de lectura sobre fondos claros (0 ocurrencias restantes en el módulo de juegos).

4. **P1-1 · Internacionalización y plurales (T4):**
   - 0 ternarios `isEs ?` en el módulo de juegos; todos los textos, títulos y `aria-label` se resuelven mediante `t.games.*` en `translations.ts` (ES y EN).
   - Plurales y conteos correctamente localizados.

5. **P2 · Tipografía y tokens de diseño (T5):**
   - Eliminado `font-bubble` de dilemas y resultados; títulos unificados en `font-display font-black`.
   - Eliminados todos los hex sueltos en el módulo de juegos en favor de tokens CSS.
   - Colores de confeti estandarizados con `GAME_CONFETTI_COLORS`.

6. **P1-5 · Recompensa limpia en el Pot y baseline de slop (T6):**
   - `RewardWinnerModal.tsx` renombrado y reubicado a `src/components/pot/RewardMemberModal.tsx`.
   - UI de consumidor saneada: montos en moneda local (`useMonPrice`), acordeón "Detalles técnicos" cerrado por defecto, y cero jerga cripto fuera de detalles técnicos.
   - `scripts/check-slop.mjs` ampliado para auditar `\b(MON|Monad|onchain|testnet|faucet|ledger)\b` con seguimiento de línea base en `scripts/slop-baseline.json` (0 regresiones).

7. **P1-6 · Gesto de deslizar en This or That (T7):**
   - Restaurado `drag="x"` con umbral de 90px (izquierda = A, derecha = B).
   - Sellos traducidos "ELEGIR A/B" y respeto estricto a `prefers-reduced-motion`.
   - Bloques conservan su funcionalidad táctil/clic accesible.

8. **Limpieza, linteo y pruebas reales (T8):**
   - `useMemo` de `friendsToDisplay` estabilizado con dependencias limpias.
   - 0 advertencias de ESLint en todo el proyecto (`pnpm lint` 100% limpio).
   - `game-stage-primitives.test.tsx` reemplazado por pruebas reales de render estático (`renderToStaticMarkup`).
   - `whos-most-likely-ranking.test.ts` eliminado por redundancia con `games-voting.test.ts`.
   - `pnpm release:check` pasando al 100% (check-slop, typecheck, lint, test, build).

