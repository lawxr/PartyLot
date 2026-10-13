# Handoff: correcciones de la UI de juegos

**Para el agente que ejecute esto.** Léelo completo antes de tocar código. Contexto y evidencia: `docs/plans/games-ui-audit.md` (hallazgos) y `docs/plans/games-ui-from-trailer-plan.md` (diseño de origen). Esta página es el plan de ejecución.

## 0. Reglas de trabajo

- Lee `AGENTS.md`: **este Next.js (16.3) no es el que conoces**. Antes de tocar rutas, middleware o APIs, consulta `node_modules/next/dist/docs/`.
- Trabaja en una rama (`fix/games-ui-audit`) y haz un commit por tarea (`fix(games): …`), en el orden de la sección 2.
- **No toques**: `trailer-film/`, `launch-film/`, `.agents/`, `brag-output*/`. Tampoco rehagas el diseño: el aspecto visual ya está aprobado. Solo se corrigen los puntos de abajo.
- Texto de UI: todo por `src/lib/i18n/translations.ts` (ES y EN). Sin emojis, sin MON/Monad/onchain/testnet en vistas de consumidor, sin morado `#836EF9`, sin hex sueltos (usar tokens de `globals.css`).
- Después de cada tarea: `pnpm typecheck && pnpm lint && pnpm test`. Al final: `pnpm release:check` y `node scripts/check-slop.mjs`.
- Al terminar, marca cada tarea en la sección 6 y deja `docs/plans/games-ui-audit.md` con una sección "Resuelto".

## 1. Cómo reproducir y verificar (úsalo antes y después)

Servidor en `http://localhost:3000` (`pnpm dev`). Los juegos necesitan una fiesta con miembros; en el navegador, desde la consola o con Playwright:

```js
const names = ['Sofi','Mateo','Valen','Nico','Maya','Juli'];
const party = { id:'p1', code:'8F4K', title:"Friday at Sofi's", date:'Fri', time:'10:30 PM', location:'', description:'',
  coverImage:'', hostId:'m0', hostName:'Sofi', potBalance:0, createdAt:'', status:'live',
  members: names.map((n,i)=>({ id:'m'+i, name:n, avatar:'', role:i?'guest':'host' })) };
const s = window.__partyStore;                        // expuesto por app/page.tsx
document.documentElement.classList.toggle('dark', true);
s.setState({ parties:[party], currentPartyId:'p1', theme:'dark', language:'es',
  currentUser:{ ...s.getState().currentUser, isPrivyAuthenticated:true, id:'m1', name:'Mateo' },
  activeGameId:'whos-most-likely', currentView:'games' });
```

Capturas obligatorias al final (claro y oscuro, ES y EN): 390×844, 360×640 y 1440×900, de Who's Most Likely (votar, resultado), This or That (sin voto / con voto) y Trivia. Revisa que no haya scroll vertical de página en 390×844 salvo con más de 4 personas.

## 2. Tareas (en este orden)

### T1 · Voto único por persona (P0-1) — el más importante

**Problema.** Cada toque suma un voto (`voteWhosMostLikely`, `voteThisOrThat` en `src/store/usePartyStore.ts`, ~líneas 1295 y 1410). Medido: 5 toques en la misma tarjeta → "5 de 6 personas votaron". Además, `persistGameSessionToSupabase` envía **todo el arreglo `questions`** a `POST /api/parties/games`, que lo hace `upsert` tal cual (`src/app/api/parties/games/route.ts`): cualquier miembro puede sobrescribir los votos de todos (último que escribe gana) y `userVote` viaja en ese mismo bloque, así que se comparte entre usuarios.

**Diseño pedido.**
1. Cambiar el modelo en `src/types/index.ts`:
   - `WhosMostLikelyQuestion`: añadir `voters: Record<string, string>` (`userId → memberId elegido`). `votes` (conteo por miembro) pasa a **derivarse** de `voters`; mantener el campo por compatibilidad de lectura y recalcularlo siempre.
   - `ThisOrThatQuestion`: añadir `voters: Record<string, 'A' | 'B'>`; `votesA/votesB` derivados; `userVote` pasa a calcularse como `voters[currentUser.id]` (dejar de guardarlo en el bloque compartido).
   - Lectura de datos antiguos: si falta `voters`, tratarlo como `{}` y conservar los conteos antiguos como base (no perder histórico).
2. Mover la lógica a funciones puras en `src/lib/games.ts` (nuevo), con estas firmas y comportamiento:
   - `applyVote(question, userId, choice)`: si no había voto → suma; si es la **misma** opción → no cambia (idempotente; no hay "quitar voto" salvo que se pida); si es otra → resta la anterior y suma la nueva.
   - `tally(question)` → conteos por opción; `rank(members, votes)` → ordenados desc., estable por nombre; `winners(...)` → todos los empatados (si nadie votó, lista vacía, no el primero); `percentages(...)` → enteros que **suman 100** (método del mayor resto).
   - `votersCount(question)` → número de **personas** que votaron.
3. El store usa esas funciones. `voteWhosMostLikely(questionId, memberId)` y `voteThisOrThat(questionId, choice)` leen `state.currentUser.id` y no hacen nada si no hay usuario.
4. **Servidor.** `/api/parties/games` no debe aceptar el bloque completo del cliente para estos juegos. Para `whos-most-likely` y `this-or-that`, el cliente envía solo `{ questionId, choice }` y el servidor, con `actorId` verificado por Privy, lee la fila, aplica `applyVote` con **su propio** `actorId` y guarda. Así nadie puede votar por otro ni reescribir conteos. Para `crew-trivia` se mantiene el comportamiento actual por ahora (anotar en el commit que sigue pendiente). Usa un parche atómico (RPC o `update … returning`) si es posible; si no, vuelve a leer antes de escribir y documenta la carrera que queda.
5. Realtime: la rama de `listenToActivePartyRealtime` (~línea 1823) reemplaza `whosMostLikely` completo; debe **recalcular** conteos desde `voters` y no pisar el voto optimista local si todavía no llegó.
6. UI: en `WhosMostLikely.tsx`, quitar `votedMemberId` local como fuente de verdad; la tarjeta seleccionada es `voters[currentUser.id] === friend.id`. El "n de N" usa `votersCount`. Volver a tocar la misma tarjeta no cambia nada; tocar otra mueve el voto (la anterior se desmarca). En `ThisOrThat.tsx`, igual con `voters`. Quitar `effectiveVotes` (el parche que inventa 1 voto).
7. El confeti de This or That se quita del voto; en Who's Most Likely sigue solo al abrir el resultado.

**Pruebas (Vitest, `tests/unit/`).**
- `games-voting.test.ts`: `applyVote` (primer voto, mismo voto repetido ×5, cambio de voto, dos usuarios, dato antiguo sin `voters`); `winners` (ganador, empate de 2, nadie votó → vacío); `percentages` suman 100 con 3 y 7 votantes; `votersCount`.
- `games-route-authorization.test.ts` (sigue el patrón de `tests/unit/party-write-authorization.test.ts`): 401 sin token, 403 si no es miembro, el servidor ignora un `actorId` o conteos enviados por el cliente, un usuario no puede alterar el voto de otro.
- Prueba de store: 5 llamadas seguidas de `voteThisOrThat` con el mismo usuario dejan `votesA === 1`.

**Hecho cuando** en la verificación del paso 1 cinco toques seguidos muestran "1 de 6", y dos sesiones distintas votando a la vez conservan ambos votos.

### T2 · Un solo contenedor y una sola cabecera (P1-3)

- `GamesView` es el único dueño de `GameStage` (fondo, ancho máx. 430px) y de la cabecera (volver + título + pestañas). Los juegos (`WhosMostLikely`, `ThisOrThat`, `CrewTrivia`) dejan de renderizar `GameStage` y la flecha de volver; `GameEyebrow` queda solo con etiqueta, contador `1/5` y avatar propio (quitar prop `onBack` del uso, o hacerla opcional).
- `GameStage` usa `min-h-[100dvh]` solo cuando se usa suelto; dentro de `GamesView` no debe forzar altura. Resultado esperado en 390×844: **sin scroll de página** con ≤ 4 personas; "Ver resultado" visible sin desplazarse.
- La cuadrícula 2×2 no debe tener un segundo scroll interno: con más de 4 personas crece y scrollea la página; quitar `max-h-[380px] overflow-y-auto`.
- Quitar el ternario duplicado "en la sala / playing" de `GamesView`.
- El banner de cookies no debe tapar los botones principales: añadir un padding inferior al contenedor de juegos igual a la altura del banner mientras esté visible (`CookieConsentBanner` expone su estado; si no, usar una variable CSS `--cookie-banner-h`).

### T3 · Contraste en modo claro (P1-2)

- Añadir en `globals.css` `--stage-accent-text`: `#171512` en `:root`, `var(--party-yellow)` en `.dark`; exponerlo en `@theme` como `--color-stage-accent-text`.
- Reemplazar `text-party-yellow` por `text-stage-accent-text` en `GameEyebrow`, `WinnerReveal` ("THE CREW HAS SPOKEN") y la cabecera de `GamesView`. Cualquier otro texto amarillo sobre superficie clara del módulo (`grep -rn "text-party-yellow" src/components/games src/components/views/GamesView.tsx`).
- `PickBlock`: el aro de selección usa `ring-[var(--stage-ring-outline)]` en claro (hoy es `ring-white`, casi invisible) y blanco en oscuro.
- **Hecho cuando** todo texto ≥ 4.5:1 en ambos temas (medir con el detector: `.agents/skills/impeccable/scripts/impeccable detect src/components/games src/components/views/GamesView.tsx`, y a mano con una captura).

### T4 · i18n completo del módulo (P1-1)

- Añadir en `translations.ts` (ES y EN, y el tipo `TranslationDictionary`) un bloque `games` ampliado: `crewHasSpoken`, `optionLabel(choice)`, `tapToVote`, `votedOf(n, total)` (con plural), `votes(n)` (con plural: "1 voto" / "2 votos", "1 vote" / "2 votes"), `voteBreakdown`, `topPick`, `viewResult`, `keepVoting`, `nextPrompt`, `nextDilemma`, `previous`, `next`, `skip`, `votesRegistered(n)`, `voteFor(name)`, `choose(title)`, etc.
- Sustituir todos los textos fijos y los `isEs ? … : …` de: `GameProgress`, `WinnerReveal`, `VoteBar`, `PickBlock`, `FriendVoteCard` (los `aria-label` también), `GameEyebrow`, `WhosMostLikely`, `ThisOrThat`, `CrewTrivia`, `GamesView`. Los componentes de `stage/` reciben el texto por props o usan `useTranslation`; nada en español o inglés escrito a mano.
- **Hecho cuando** `grep -rnE "isEs \?|'(votos?|voto|personas votaron|OPCIÓN)" src/components/games src/components/views/GamesView.tsx` no devuelve nada y la captura en EN no tiene ninguna palabra en español (y al revés).

### T5 · Tipografía y tokens (P2)

- Quitar `font-bubble` (Modak) de títulos de dilema (`PickBlock`) y nombre del ganador (`WinnerReveal`); usar `font-display font-black` (la misma que el resto de títulos del módulo). Modak queda solo para el wordmark.
- Crear `--game-orange: #ff7a3d` y `--game-orange-ink: #1c0d04` en `globals.css` (+ `@theme`), `--stage-ink: #171512`, `--stage-vs: #0e0c09`. Reemplazar `#ff7a3d`, `#1c0d04`, `#0e0c09`, `#171512` en `PickBlock`, `FriendVoteCard`, `ThisOrThat`. Los colores del confeti se leen de una constante `GAME_CONFETTI_COLORS` en `src/lib/games.ts`.

### T6 · Recompensa limpia en el Party Pot (P1-5)

- Mover `src/components/games/RewardWinnerModal.tsx` a `src/components/pot/RewardMemberModal.tsx` (renombrar) y actualizar el import en `PartyPotView.tsx`.
- Rehacerlo con el diseño del plan de limpieza: montos en **moneda local** (usar `useMonPrice` para convertir), sin morado, sin "ONCHAIN", sin "Monad". El hash y el enlace al explorador van dentro de un acordeón "Detalles técnicos" cerrado por defecto. Textos por i18n (T4). Confeti con `GAME_CONFETTI_COLORS`.
- Ampliar `scripts/check-slop.mjs`: `CRYPTO_REGEX` debe detectar `\b(MON|Monad|onchain|testnet|faucet|ledger)\b` (sin distinguir mayúsculas, salvo `MON` en mayúsculas) en vistas de consumidor; mantener excepciones explícitas y comentadas para `privacy`, `terms`, `api/`, mocks y el bloque "Detalles técnicos". Si la regla nueva encuentra más sitios (`PartyPotView`, `PartyDetailView`, `stats`, `SharedExperienceModal`, `TokenLogo`), **no los arregles aquí**: añade un archivo `scripts/slop-baseline.json` con el conteo actual por archivo, haz que el script falle si algún conteo **sube** y anota los pendientes en el audit.

### T7 · Gesto de deslizar en This or That (P1-6)

Decisión pendiente del producto; hasta que se confirme, **recuperar el gesto** sin cambiar el diseño: `drag="x"` sobre el contenedor de bloques (umbral 90px; izquierda = A, derecha = B), con los sellos "ELEGIR A/B" traducidos y `data-disable-swipe-back` intacto. Los bloques siguen siendo botones. Con `prefers-reduced-motion` no hay rotación ni sellos animados. Si el producto decide quitarlo, borra el código y anótalo.

### T8 · Limpieza

- `useMemo` de `friendsToDisplay`: depender de `party?.members` (estable) y no de un arreglo recreado cada render; arreglar el aviso `react-hooks/exhaustive-deps`.
- Quitar variables sin usar en los archivos tocados (los 14 avisos de `pnpm lint` en `src/`: `PartyDetailView`, `ProfileView`, `PartyPotView`, `RecapView`, `lib/time.ts`, `tests/unit/party-deep-link.test.ts`, además de los del módulo).
- Reemplazar `tests/unit/game-stage-primitives.test.ts` (solo comprueba `typeof === 'function'`) por pruebas de render reales (con `react-dom/server` o Testing Library si ya está en el proyecto; si no, `renderToStaticMarkup`): `FriendVoteCard` seleccionado/no seleccionado (`aria-pressed`, clase amarilla), `PickBlock` A/B con y sin porcentaje, `WinnerReveal` con 1 ganador y con empate, `VoteBar` con 0%. Borrar `whos-most-likely-ranking.test.ts` (reimplementa la lógica dentro del test) porque lo sustituye `games-voting.test.ts`.

## 3. Fuera de alcance (no lo hagas)

- Rediseñar pantallas, cambiar colores del plan o añadir juegos.
- Leaderboard y puntos.
- Migrar el resto de la app de `isEs ?` a `t.*` ni limpiar jerga cripto fuera del módulo de juegos (solo se deja la línea base de T6).
- Cambios de esquema de Supabase: el modelo nuevo vive dentro del JSON `questions` que ya existe. Si de verdad hace falta una migración para el parche atómico del servidor, escríbela en `supabase/migrations/` con el patrón de las existentes y avisa antes de aplicarla.

## 4. Criterios de aceptación globales

1. Cinco toques seguidos en una tarjeta / bloque → un solo voto; cambiar de opción mueve el voto; el contador cuenta personas.
2. Dos usuarios votando a la vez no se pisan; un usuario no puede escribir votos ajenos (prueba de ruta).
3. Sin scroll de página en 390×844 con ≤ 4 personas; una sola flecha de volver.
4. Contraste ≥ 4.5:1 en claro y oscuro; aro de selección visible en ambos.
5. Cero texto fijo en un idioma: las capturas ES y EN son coherentes; plurales correctos.
6. `RewardWinnerModal` ya no existe en `components/games/`; ninguna cadena MON/Monad/onchain visible fuera de "Detalles técnicos".
7. `pnpm release:check` verde; `node scripts/check-slop.mjs` verde con la regla ampliada y la línea base.
8. Re-auditoría con `$impeccable audit` sobre `GamesView`: sin P0 ni P1.

## 5. Entrega

- Rama `fix/games-ui-audit` con commits por tarea, y un resumen (en el PR o en el audit) que liste: pruebas añadidas, capturas antes/después, y cualquier decisión que hayas tenido que tomar (sobre todo T1.4 y T7).
- Si algo del servidor no se puede hacer de forma atómica, dilo explícitamente en el resumen; no lo ocultes tras un comentario en el código.

## 6. Seguimiento

- [x] T1 Voto único por persona + servidor + pruebas
- [x] T2 Un solo contenedor / cabecera / sin scroll
- [x] T3 Contraste en claro
- [x] T4 i18n y plurales
- [x] T5 Tipografía y tokens
- [x] T6 Modal de recompensa en el Pot + `check-slop` ampliado con línea base
- [x] T7 Gesto de deslizar
- [x] T8 Limpieza y pruebas reales
- [x] Capturas finales y re-auditoría
