# Partylot: auditoría de UI social y plan de limpieza

> Método: `impeccable audit` + `critique` en un solo contexto (⚠️ DEGRADED: sin herramienta de sub-agentes), con el detector `impeccable detect`, capturas Playwright en 390×844 y 1440×900 contra `localhost:3000`, y análisis estático de `src/`.
> Referencias: `PRODUCT.md` ("consumer social app first", "not a crypto dashboard", "blockchain should feel invisible") y `DESIGN.md` ("no neon glow", "neutral system typography for product UI", "not AI-generated").

---

## 1. Resumen ejecutivo

| # | Dimensión | Score | Hallazgo clave |
|---|-----------|-------|----------------|
| 1 | Accesibilidad | 2/4 | 0 `aria-live`; ~78 `motion.div` clicables sin semántica de botón; 138 textos de 8–10px |
| 2 | Rendimiento | 3/4 | 43 fallbacks remotos de Unsplash; muchas capas `backdrop-blur`; escala de foto en hover |
| 3 | Theming | 1/4 | **2.256 hex hardcodeados** + 163 colores de Tailwind fuera de la paleta (purple/blue/pink/emerald); los tokens de `globals.css` casi no se usan |
| 4 | Responsive | 3/4 | Mobile-first sólido; el banner de cookies tapa ~40% del viewport móvil y el CTA principal |
| 5 | Integridad de implementación | 1/4 | Mucho AI slop: 99 emojis, jerga cripto en la UI, nombres y caras falsas de fallback, copy gamificado, restos de comentarios de mockup |
| **Total** | | **10/20** | **Aceptable: hace falta trabajo importante** |

**Veredicto de integridad: FALLA.** La base visual (crema cálido, amarillo `#F0DC00`, fotos) es propia del producto, pero encima hay capas que la hacen parecer una demo de hackathon generada por IA y no una red social: badges de emoji en vez de avatares, logs del sistema en vez de un feed de personas, "MON / Monad Testnet / Gas / Ledger" en pantallas de consumidor, "Shared Damage", "Consensus Votes" o "Official AUX DJ", y caras de extraños de stock que aparecen como si fueran usuarios reales.

**Detector:** solo marcó 1 hallazgo (`overused-font`, Plus Jakarta Sans en `globals.css:1`). Ese aviso es casi un falso positivo, porque Jakarta solo es fallback; el problema real de tipografía es que Fredoka (redondeada, de display) se usa para todo el texto de UI. El detector no ve slop de copy ni de contenido, así que casi todos los hallazgos de abajo salen de la revisión manual.

Conteo de problemas: **P0: 2 · P1: 9 · P2: 8 · P3: 4**

---

## 2. Hallazgos por severidad

### P0: rompen la confianza o la tesis del producto

**P0-1 · Caras de extraños y nombres falsos en lugar de datos reales**
- Hay 43 URLs de Unsplash usadas como `m.avatar || 'https://images.unsplash.com/...'` (`HomeView.tsx`, `PartyDetailView.tsx`, `CrewDetailView.tsx`, etc.). Un miembro sin foto aparece con la cara de otra persona. En una red social eso es una violación de identidad.
- Nombres hardcodeados como fallback: `'Law'` (`HomeView.tsx:58`, `ProfileView.tsx:361`, `api/treasury/action/route.ts:342`), `'Ana'` y `'Carlos'` (`RecapView.tsx:145-160, 278-279, 416, 424`; `PartyPotView.tsx:1042,1050`). El Recap puede declarar "MVP: Ana" en una fiesta donde no hay ninguna Ana.
- `SharedExperienceModal.tsx:350` inventa `favoriteGame || "Who's Most Likely"`.
- **Arreglo:** crear `<Avatar>` con iniciales y un color derivado del id del usuario. Si no hay dato, se oculta la línea (premio, juego favorito) en vez de inventarla. La portada del perfil por defecto pasa a ser una superficie neutra con el color del usuario, no un retrato de stock.

**P0-2 · La blockchain no es invisible (va contra PRODUCT.md §4, §11 y §12)**
- La jerga aparece en 25 archivos de UI. Los peores: `PartyDetailView.tsx` (76), `PartyPotView.tsx` (72), `SharedExperienceModal.tsx` (39), `app/stats/page.tsx` (37), `RecapView.tsx` (34).
- Ejemplos: "Onchain treasury on Monad Testnet", "Sponsored gas · Monad Treasury", "Signing with your wallet", "Address copied for Monad Faucet", "View contract on Monad Explorer", "⚡ Certify Night in Group Ledger", "VERIFIED SOCIAL GRAPH / ONCHAIN RECORD", "SOCIAL GRAPH REPUTATION (MONAD)" en el perfil, el placeholder `@satoshi.monad`, montos `0.0042 MON` y actividades del tipo "⚡ Pago liquidado en Monad Testnet".
- **Arreglo:** usar un glosario de consumidor (§4). Los montos se muestran en moneda local y el token solo aparece en una vista de "Detalles técnicos" colapsada dentro de Party Pot. Las pantallas de perfil, Recap, notificaciones y feed quedan sin ninguna mención a la cadena.

### P1: alejan el producto del estándar de red social

**P1-1 · No hay URLs por pantalla**
`app/page.tsx` cambia de vista según `currentView` en Zustand. Por eso el botón atrás del navegador no funciona, no hay links compartibles a perfiles, crews o recaps, y `/party/[id]` redirige a `/`. Cualquier red social tiene `/@handle`, `/c/[crew]`, `/p/[party]` y `/p/[party]/recap`.
→ Migrar a rutas del App Router: `/`, `/tonight`, `/crews`, `/crews/[id]`, `/p/[id]`, `/p/[id]/{split,pot,games,polls,recap}`, `/u/[handle]`, `/settings`. Antes de tocar nada, leer `node_modules/next/dist/docs/` (Next 16.3).

**P1-2 · El "feed" de actividad es un log del sistema, no posts de personas**
Hoy son strings como `💰 ${name} aportó 0.0042 MON al Party Pot (Monad)` (`usePartyStore.ts:661-1593`), generados en español aunque la UI esté en inglés. Una red social muestra **actor (avatar + nombre) · verbo · objeto · tiempo relativo · reacción**.
→ Guardar las actividades como datos estructurados `{actorId, verb, objectType, objectId, amount?, createdAt}` y redactar el texto en la capa de i18n al renderizar. Añadir tiempo relativo con `Intl.RelativeTimeFormat` (ya hay un helper en `lib/web3Error.ts:97`; hay que moverlo a `lib/time.ts`).

**P1-3 · Notificaciones fuera de estándar**
`NotificationsPopover.tsx:56-90` usa emojis como icono (💰💸📊🎮🎉), pills de colores fuera de la paleta (blue, purple, pink, emerald) y un pie "💡 Notifications update live with your crew". El punto de no leídas aparece si `activities.length > 0`, sin ningún estado de leído.
→ Avatar del actor con un mini badge de icono Lucide monocromo, separación "Hoy / Antes", estado leído/no leído real, "Marcar todo como leído" y quitar el pie.

**P1-4 · Navegación y CTAs redundantes**
- Las pestañas **Home y Tonight** repiten la misma estructura (fiesta principal, crear, unirse con código).
- En Home, "Crear fiesta" aparece 3 veces: el `+` del header, el CTA de la tarjeta y el estado vacío de "Upcoming".
- En Tonight: "Have a code", "Create Party" y "Host a party tonight", todos en el mismo viewport.
- "Tonight" usa el icono de calendario.
→ Un solo punto de creación (el `+` del header abre un sheet con "Crear fiesta" y "Unirme con código"). Fusionar Tonight dentro de Home como "Esta noche" + "Próximas", y liberar esa pestaña para **Actividad** (notificaciones y feed), que es el estándar de 4 pestañas en apps sociales: Inicio · Crews · Actividad · Perfil.

**P1-5 · Affordances falsas**
- El ❤️ "Favorite party" (`HomeView.tsx:26`) es `useState` local: se pierde al recargar y no hace nada.
- La estrella "Follow (star)" choca con la tesis "not follower-based" y con el lenguaje de "Tu gente / noches juntos".
→ Quitar el corazón, o persistirlo como "Guardar". Reemplazar la estrella por una relación implícita (gente con la que compartiste noches) y una acción "Fijar" si hace falta.

**P1-6 · Copy gamificado o "de IA" que no suena a red social**

| Actual | Propuesto (EN / ES) |
|---|---|
| Shared Damage / Daño compartido | Spent together / Gastado juntos |
| Consensus Votes | Votes / Votos |
| MVP of the Night · Game King · Official AUX DJ | Most voted · Top player · On music (solo si hay dato real) |
| Certify Night in Group Ledger | Save to crew history / Guardar en la historia del crew |
| Verified attendees | Who came / Quiénes vinieron |
| Knock on the Door / Tocar puerta | Request to join / Pedir unirme |
| Lore check | Answer / Respuesta |
| Party Legend, Party MVP, tiers con 🎲👑⚡🎉 | Se quitan del perfil; como mucho "N noches con tu gente" |
| "Perks: ✓ Can RSVP to invited parties" | Se elimina (presenta derechos básicos como premios) |
| Create stylish invitations and share them for any event (landing) | Mensaje de PRODUCT.md: "Your crew, every night out: play, split, remember." Hoy suena a un clon de event-planning, que el producto dice explícitamente no ser |
| Good evening, ${name} 👋 | Saludo según la hora real, sin emoji, o se quita |

**P1-7 · 99 emojis en la UI y en los textos para compartir**
Por archivo: `RecapView` 28 · `usePartyStore` 12 · `SharedExperienceModal` 10 · `ThisOrThat` 10 · `PartyDetailView` 9 · `NotificationsPopover` 7 · `ProfileView` 5 · `CrewTrivia` 3 · `WhosMostLikely` 3 · `HomeView`, `BottomSheet`, `PartyInviteModal` y `services/party.ts` 1 cada uno.
→ Regla: **cero emojis en chrome, labels, badges y toasts**. Las elecciones de los propios usuarios (reacciones, nombres de crew) pueden tener emoji. Los textos para compartir (`RecapView.tsx:139-163`, `PartyInviteModal.tsx:195`, `services/party.ts:27`) pasan a ser una línea limpia + URL, y la imagen OG hace el trabajo visual. El ✕ de `BottomSheet.tsx:93` se cambia por `<X/>` de Lucide. Las flechas 👈👉 de ThisOrThat se reemplazan por iconos de flecha y un hint de gesto.

**P1-8 · i18n duplicado y roto**
Hay 569 ternarios `isEs ? … : …` en línea, mientras `lib/i18n/translations.ts` (1.049 líneas) existe y se usa 0 veces vía `t`. Hay strings sin traducir: `aria-label="Create Party"`, `'Localizando fiesta...'` siempre en español, las actividades del store siempre en español y `'Invite Link Copied!'` siempre en inglés.
→ Migrar pantalla por pantalla a `t.namespace.key` y añadir una regla de lint que prohíba `isEs ?` en JSX nuevo.

**P1-9 · Accesibilidad de la interacción principal**
- ~78 `motion.div onClick` (tarjetas de fiesta y de crew) no son focusables ni activables con teclado. Hay que usar `<button>`/`<Link>` con `motion` envolviendo.
- 0 regiones `aria-live`: toasts, "copiado", errores de pago y votos no se anuncian.
- El TabBar usa `role="tablist"` para la navegación principal. Debe ser `<nav>` con links y `aria-current="page"`.
- 2 `alert()` nativos (`TopNav.tsx`, `PartyDetailView.tsx:834`) se cambian por un toast.

### P2

- **P2-1 · Glow y gradientes que DESIGN.md prohíbe.** TabBar activo: `linear-gradient(#FFE973→#F8BF0A)` + `0 0 20px rgba(255,212,41,.5)`. Botones con `shadow-[0_4px_16px_rgba(240,220,0,.35)]`. Hay que usar el amarillo plano con el token `--party-yellow` y sombra neutra.
- **P2-2 · Iconos decorativos.** `Sparkles` ×39, `Zap` ×11, `Trophy` ×13, `Crown` ×8, `Flame` ×8. Se dejan solo donde significan algo (Trophy en el ganador de un juego); el resto se quita, incluido el eyebrow "✨ Start the night".
- **P2-3 · Tipografía.** Fredoka se usa en todo el UI y en el cuerpo de texto. Hay 132 `uppercase` con `tracking-wider/widest` (estilo "label de dashboard") y 138 tamaños de 8–10px. Plan: Modak solo para el wordmark y los momentos de Recap; display redondeado para títulos; **system UI** (`-apple-system, Inter Tight / SF`) para cuerpo y metadatos, como dice DESIGN.md. Mínimo 12px para metadatos y 11px para captions.
- **P2-4 · Theming.** 2.256 hex en línea, y cada componente duplica `bg-[#FFFDF8] dark:bg-[#1C1A16]`. Hay que mapear los tokens de `DESIGN.md §3` a `@theme` de Tailwind v4 (`bg-surface`, `text-secondary`, `border-divider`) y hacer un codemod.
- **P2-5 · Colores fuera de paleta.** Hay 163 `purple|blue|emerald|pink|indigo|cyan-*` (`PartyDetailView.tsx:505-515`, Notifications, y el punto lila de "Reputation" en el perfil). Las categorías se distinguen por icono, no por arcoíris.
- **P2-6 · El banner de cookies tapa el CTA principal** en móvil (~40% de la pantalla) y menciona la "wallet". Debe ser una barra compacta de una línea abajo, por encima del TabBar, y sin la palabra wallet.
- **P2-7 · Jerarquía del perfil.** La tarjeta de "Reputation (Monad)" está entre las métricas y el contenido. Estándar: portada → avatar → nombre/@handle → bio → métricas → **[Editar perfil] [Compartir]** → pestañas (Noches · Crews · Fotos) → grid. La reputación sale del perfil.
- **P2-8 · Recuerdos sin interacción social.** Las fotos de una fiesta no tienen reacciones, comentarios ni autor visible. Como mínimo: autor + tiempo, y una reacción rápida (un solo tipo, por ejemplo ❤️ como acción del usuario, que no cuenta como decoración).

### P3

- **P3-1** · 60 comentarios-banner con restos del prompt de mockup (`/* PHONE 2 TOP FLOATING CONTROLS */`, `/* PHONE 3: ADD TO THE PARTY POT */`, `iOS Liquid Glass`). Hay que borrarlos.
- **P3-2** · Código muerto: `LiquidBlob.tsx` (0 usos); `GlassPanel` y `AvatarStack` con 1 uso cada uno, que conviene consolidar.
- **P3-3** · Zoom en hover de las fotos (`group-hover:scale-105`, 700ms) en tarjetas que en móvil no tienen hover. Se quita.
- **P3-4** · `'Medellín'` hardcodeado como ubicación por defecto en `ProfileView.tsx:238`.

---

## 3. Patrones sistémicos

1. **Contenido inventado para "llenar":** fallbacks de stock, nombres semilla y premios por defecto. La regla pasa a ser: *si no hay dato, no hay línea*.
2. **Copy escrito para jueces de hackathon y no para amigos:** "onchain", "verified", "ledger", "consensus". Va un glosario único (§4) y un lint de palabras prohibidas.
3. **Estilos sin sistema:** hex en línea, glow y colores arcoíris. Se resuelve con tokens en `@theme` + codemod.
4. **i18n paralelo:** el diccionario existe pero no se usa. Migrar a `t`.
5. **Una SPA de estados en lugar de rutas:** rompe atrás, compartir y deep links, que son el núcleo de lo "social".

## 4. Glosario de consumidor (fuente única para el copy)

| Interno / técnico | En la UI |
|---|---|
| Treasury / Tesorería onchain / Party Pot (Monad) | **Party Pot** / **Bote** |
| MON, 0.0042 MON | $ en moneda local (MON solo en "Detalles técnicos") |
| Wallet / Billetera / Signing | Tu cuenta / Pagar |
| Gas sponsored | (no se muestra) |
| Faucet / Explorer / Contract | Solo dentro de "Detalles técnicos" colapsado en Party Pot |
| Attest / Certify / Ledger / Onchain record | Guardar en la historia del crew |
| Social graph reputation | (no se muestra) / "N noches juntos" |
| Bounty | Tarea · Recompensa |
| Knock | Pedir unirme |
| Verified attendee | Asistió |

---

## 5. Plan de ejecución

Cada fase se puede mergear por separado. El orden minimiza los conflictos: primero las fundaciones y después las pantallas.

### Fase 0: Fundaciones (1 PR, sin cambios visuales grandes)
1. **Tokens:** pasar `DESIGN.md §3` a `@theme` en `globals.css` (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-2`, `--color-divider`, `--color-accent`, más variantes dark). Sin glow.
2. **Tipografía:** stack system-ui para cuerpo; `font-display` (redondeada) solo para títulos; Modak solo para el wordmark. Quitar Plus Jakarta del import.
3. **Primitivas:** `<Avatar user size>` (foto o iniciales, sin Unsplash), `<Toast>` + `aria-live`, `<RelativeTime>`, y `<PressableCard>` (botón o Link accesible con motion).
4. **i18n:** el glosario §4 como claves en `translations.ts` y la regla de lint `no-restricted-syntax` para `isEs ?`.
5. **Guardas en CI** (`scripts/check-slop.mjs` dentro de `release:check`):
   - Emojis en `src/components/**` y `src/app/**` (excepto `api/`): 0.
   - `/monad|testnet|onchain|ledger|faucet|gas\b|\bMON\b/i` fuera de `PartyPotView` > Detalles técnicos y fuera de `privacy`/`terms`: 0.
   - `images.unsplash.com` en `src/`: 0.
   - Fallbacks `'Ana'|'Carlos'|'Law'` en `src/` (excepto `data/mockData.ts` dentro de demo): 0.

### Fase 1: Limpieza de slop (rápido, alto impacto) → `$impeccable distill` + `$impeccable clarify`
1. Quitar los 99 emojis según la regla P1-7 y reescribir los textos para compartir.
2. Quitar los avatares, portadas y nombres falsos (P0-1) y usar `<Avatar>`.
3. Aplicar el glosario en todas las pantallas de consumidor (P0-2). Perfil, Recap, notificaciones, feed y SharedExperience quedan sin jerga. Party Pot se queda con un acordeón "Detalles técnicos".
4. Reescribir el copy gamificado según la tabla de P1-6, más el titular de la landing.
5. Quitar la tarjeta de Reputation y los tiers con emoji del perfil.
6. Quitar los iconos decorativos (P2-2), el glow y los gradientes (P2-1) y el zoom en hover (P3-3).
7. Borrar los comentarios de mockup (P3-1), `LiquidBlob` (P3-2) y `'Medellín'` (P3-4).

### Fase 2: Arquitectura de información social → `$impeccable shape` + `$impeccable layout`
1. Rutas del App Router (P1-1) con `<Link>` y un `TopNav` con `router.back()`. Mantener Zustand solo como caché de datos, no como router. Añadir OG metadata a `/p/[id]`, `/p/[id]/recap` y `/u/[handle]`.
2. Pestañas: **Inicio · Crews · Actividad · Perfil** (P1-4). Tonight se fusiona en Inicio.
3. Un solo punto de creación (`+` → sheet "Crear fiesta / Unirme con código"). Borrar los CTAs duplicados.
4. Quitar el corazón falso; decidir el modelo de "seguir" (P1-5).

### Fase 3: Patrones de red social → `$impeccable shape` + `$impeccable onboard`
1. **Actividad estructurada** (P1-2): migrar el store y la tabla de Supabase `activities` a `{actor_id, verb, object_type, object_id, meta, created_at}` y redactar el texto en el cliente. Fila estándar: Avatar 40px · **Nombre** verbo objeto · tiempo relativo · miniatura opcional.
2. **Notificaciones** (P1-3): leídas y no leídas (`last_seen_at` por usuario), grupos Hoy/Antes, marcar todo como leído y badge con contador real.
3. **Perfil** (P2-7): portada neutra, botones [Editar perfil] [Compartir perfil], pestañas Noches · Crews · Fotos y "Tu gente" ordenada por noches compartidas.
4. **Recuerdos** (P2-8): autor + tiempo, y una reacción con contador (optimista).
5. **Estados vacíos** con una sola acción, sin dashed boxes duplicados.

### Fase 4: Sistema visual y theming → `$impeccable typeset` + `$impeccable colorize` (en modo restricción)
1. Codemod de hex a tokens (P2-4), empezando por las 6 vistas grandes (`PartyPotView`, `ProfileView`, `PartyDetailView`, `SplitView`, `ActivityView`, `CrewDetailView`).
2. Quitar los colores arcoíris (P2-5).
3. Pasar de 138 tamaños de 8–10px a una escala de 11/12/13/15/17/22/28/34. Quitar `uppercase tracking-widest` de los metadatos.
4. Banner de cookies compacto (P2-6).

### Fase 5: Accesibilidad y robustez → `$impeccable harden` + `$impeccable adapt`
1. `PressableCard` en todas las tarjetas, `<nav>` + `aria-current` en el TabBar, `aria-live` en toasts y errores, y cambiar los `alert()` por toasts (P1-9).
2. i18n: terminar la migración de los 569 ternarios (P1-8), pantalla por pantalla, empezando por la que se esté tocando en cada fase.
3. Probar textos largos (nombres de 40 caracteres, crews con emoji del usuario), 0 / 1 / 200 miembros y zoom al 200%.

### Fase 6: Verificación → `$impeccable polish` + re-audit
1. `pnpm release:check` (typecheck, lint, test, build) con `check-slop` en verde.
2. Capturas Playwright 390 y 1440 de Inicio, Crews, Actividad, Perfil, Fiesta, Party Pot y Recap, **con datos demo** (`NEXT_PUBLIC_PARTYLOT_DEMO_MODE=true`), en light y dark.
3. Re-ejecutar `$impeccable audit`. Meta: **≥17/20**, con Integridad ≥3 y Theming ≥3.

---

## 6. Criterios de aceptación ("parece una red social")

- [ ] Todo lo que hace una persona aparece con **su** avatar, su nombre y un tiempo relativo.
- [ ] Ninguna pantalla fuera de "Party Pot → Detalles técnicos" menciona la cadena, el token, la wallet o el gas.
- [ ] Hay 0 emojis decorativos y 0 caras o nombres inventados.
- [ ] Cada perfil, crew, fiesta y recap tiene una URL compartible con preview OG, y el botón atrás funciona.
- [ ] Hay una sola forma visible de crear y otra de unirse por pantalla.
- [ ] Las notificaciones tienen estado leído/no leído real.
- [ ] Se puede navegar con teclado y las tarjetas son botones o links.
- [ ] Sin glow, sin colores arcoíris, y los tokens vienen de `@theme`.

## 7. Lo que ya funciona (mantener)
- La paleta crema + amarillo + fotografía es propia y cálida, no genérica.
- La estructura mobile-first con TabBar inferior y header con acción principal ya está en la zona del pulgar.
- Los estados vacíos ya existen en casi todas las vistas: solo hay que reducirlos a una acción.
- Hay buen trabajo de base en `aria-label` de botones de icono y `focus-visible` en el TabBar.
