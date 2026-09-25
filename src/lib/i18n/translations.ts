export type Language = 'es' | 'en';

export interface TranslationDictionary {
  common: {
    back: string;
    cancel: string;
    save: string;
    confirm: string;
    copy: string;
    copied: string;
    loading: string;
    error: string;
    success: string;
    share: string;
    close: string;
    privateEvent: string;
    online: string;
    hostedBy: string;
    language: string;
    switchLanguage: string;
  };
  nav: {
    home: string;
    crews: string;
    activity: string;
    profile: string;
  };
  splash: {
    welcomeTo: string;
    tagline: string;
    createEvent: string;
    haveInviteCode: string;
    privateAccess: string;
    rooftopParty: string;
    cocktailsNight: string;
    newYorkJam: string;
    days: string;
  };
  home: {
    greeting: (name: string) => string;
    createParty: string;
    yourParties: string;
    activeGatherings: string;
    upcomingCount: (count: number) => string;
    liveNow: string;
    joined: string;
    going: string;
    hostedBy: (host: string) => string;
    yourCrews: string;
    permanentCircles: string;
    membersCount: (count: number) => string;
    exploreCrews: string;
    swipeHint: string;
    noParties: string;
    createFirstParty: string;
  };
  joinParty: {
    joinCircle: string;
    gotACode: string;
    codeDescription: string;
    privateAccessBadge: string;
    errorNotFound: string;
    testCodesHint: string;
    verifiedBadge: string;
    hostLabel: (name: string) => string;
    enterPartyButton: string;
    enteringButton: string;
    connectToJoin: string;
    invitationBadge: string;
    onTheList: string;
    when: string;
    where: string;
    peopleGoing: (count: number) => string;
    confirmedGuestlist: string;
    alreadyInParty: string;
    enterParty: string;
    acceptAndJoin: string;
    accepting: string;
    signInToAccept: string;
    enterDifferentCode: string;
    invitedBy: (name: string) => string;
  };
  createParty: {
    back: string;
    stepCount: (current: number, total: number) => string;
    step1Title: string;
    step1Subtitle: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    step4Title: string;
    step4Subtitle: string;
    partyNameLabel: string;
    partyNamePlaceholder: string;
    crewLabel: string;
    noCrewOption: string;
    chooseCoverLabel: string;
    dateLabel: string;
    timeLabel: string;
    locationLabel: string;
    locationPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    nextStep: string;
    createPartyButton: string;
    partyCreatedTitle: string;
    partyCreatedSubtitle: string;
    partyCodeLabel: string;
    copyCodeButton: string;
    shareInviteButton: string;
    goToPartyButton: string;
  };
  partyDetail: {
    recap: string;
    share: string;
    codeLabel: (code: string) => string;
    privateEvent: string;
    hostedBy: (host: string) => string;
    rsvpGoing: string;
    rsvpNotGoing: string;
    rsvpMaybe: string;
    aboutTheNight: string;
    curatedBy: (host: string) => string;
    sharedAlbum: string;
    photosCount: (count: number) => string;
    addPhoto: string;
    noPhotosYet: string;
    uploadMemory: string;
    quickActions: {
      play: string;
      playSub: string;
      split: string;
      splitSub: string;
      pot: string;
      potSub: (bal: string) => string;
      poll: string;
      pollSub: string;
    };
    bountiesTitle: string;
    bountiesSubtitle: string;
    createBounty: string;
  };
  privy: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    continueApple: string;
    continueGoogle: string;
    continueEmail: string;
    connectWeb3: string;
    accessing: string;
    secureAccessBadge: string;
    accountReadyTitle: string;
    accountReadySubtitle: string;
  };
  profile: {
    title: string;
    walletAddressLabel: string;
    copyAddress: string;
    languageSection: string;
    sharedExperienceTitle: string;
    sharedExperienceSubtitle: string;
    gatherings: string;
    games: string;
    badgesTitle: string;
    pastNightsTitle: string;
    resetData: string;
    logout: string;
    nightsMetric: string;
    gamesMetric: string;
    peopleMetric: string;
    settledMetric: string;
    nightsDetailTitle: string;
    nightsDetailDesc: string;
    gamesDetailTitle: string;
    gamesDetailDesc: string;
    peopleDetailTitle: string;
    peopleDetailDesc: string;
    settledDetailTitle: string;
    settledDetailDesc: string;
    closeModal: string;
  };
  onboarding: {
    welcomeBadge: string;
    howToCallYou: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    uploadPhoto: string;
    choosePreset: string;
    submitButton: string;
    saving: string;
    errorNameRequired: string;
    errorHandleInvalid: string;
  };
  activityView: {
    subtitle: string;
    title: string;
    all: string;
    rsvps: string;
    treasury: string;
    games: string;
    polls: string;
    empty: string;
    activeCircles: string;
    members: (count: number) => string;
  };
  crews: {
    subtitle: string;
    title: string;
    createCrew: string;
    newGathering: string;
    membersCount: (count: number) => string;
    partiesCount: (count: number) => string;
    nightsTogether: (count: number) => string;
    treasuryBalance: string;
    topGame: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  crewDetail: {
    back: string;
    tabGatherings: string;
    tabMembers: string;
    tabMemories: string;
    treasury: string;
    addMemory: string;
    inviteMember: string;
    copyLink: string;
    copied: string;
    nightsTogether: (count: number) => string;
    activeGatherings: string;
    pastGatherings: string;
    membersTitle: string;
    memoriesTitle: string;
    noMemories: string;
    captionPlaceholder: string;
    uploading: string;
    saveMemory: string;
  };
  split: {
    title: string;
    subtitle: string;
    totalSharedSpend: string;
    peopleUpdated: (count: number, time: string) => string;
    tabEqual: string;
    tabCustom: string;
    tabItems: string;
    youPaid: (amount: string) => string;
    youWillReceive: string;
    owesYou: string;
    alreadyPaid: string;
    coveredDrinks: string;
    expenseBreakdown: string;
    viewAll: string;
    drinks: string;
    snacks: string;
    ride: string;
    requestPayments: string;
    editSplit: string;
    addExpense: string;
    settleOnMonad: string;
    settleSubtitle: string;
    optionsTitle: string;
    copyShareLink: string;
    categoryLabel: string;
    descLabel: string;
    amountLabel: string;
    paidByLabel: string;
    splitBetweenLabel: string;
    splitButton: string;
    settleTitle: string;
    settleEngineBadge: string;
    settleEngineDesc: string;
    settling: string;
    confirmSettle: (count: number) => string;
  };
  partyPot: {
    potTitle: string;
    addUSDC: string;
    reward: string;
    spend: string;
    rollover: string;
    balanceLabel: string;
    recentTransactions: string;
    all: string;
    deposits: string;
    spends: string;
    rewards: string;
    noTransactions: string;
    addFundsModalTitle: string;
    spendFundsModalTitle: string;
    rewardModalTitle: string;
    confirmDeposit: string;
    confirmSpend: string;
    confirmReward: string;
    processing: string;
  };
  games: {
    gamesHeader: string;
    mostLikely: string;
    thisOrThat: string;
    crewTrivia: string;
    fastDilemma: string;
    pickSide: string;
    optionA: string;
    optionB: string;
    voted: string;
    nextDilemma: string;
    whosMostLikelyTitle: string;
    whosMostLikelySubtitle: string;
    yourVote: string;
    votes: string;
    triviaTitle: string;
    triviaSubtitle: string;
    correct: string;
    incorrect: string;
    nextQuestion: string;
  };
  polls: {
    title: string;
    subtitle: string;
    createPoll: string;
    newPollTitle: string;
    questionLabel: string;
    questionPlaceholder: string;
    optionsLabel: string;
    addOption: string;
    publish: string;
    vote: string;
    votedBadge: string;
    totalVotes: (count: number) => string;
    empty: string;
  };
  recap: {
    badge: string;
    title: string;
    attest: string;
    attesting: string;
    attested: string;
    download: string;
    totalDamage: string;
    memoriesCount: string;
    gamesPlayed: string;
    peopleAttended: string;
    mvpTitle: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  es: {
    common: {
      back: 'Atrás',
      cancel: 'Cancelar',
      save: 'Guardar',
      confirm: 'Confirmar',
      copy: 'Copiar',
      copied: '¡Copiado!',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      share: 'Compartir',
      close: 'Cerrar',
      privateEvent: 'EVENTO PRIVADO',
      online: 'En línea',
      hostedBy: 'Organizado por',
      language: 'Idioma',
      switchLanguage: 'Cambiar a Inglés',
    },
    nav: {
      home: 'Inicio',
      crews: 'Crews',
      activity: 'Actividad',
      profile: 'Perfil',
    },
    splash: {
      welcomeTo: 'BIENVENIDO A',
      tagline: 'Crea invitaciones con estilo y compártelas para cualquier evento',
      createEvent: 'Crear un evento',
      haveInviteCode: 'Tengo un código de invitación',
      privateAccess: 'Acceso privado · Sin comisiones ni anuncios',
      rooftopParty: 'Fiesta en Terraza',
      cocktailsNight: 'Noche de Cócteles',
      newYorkJam: 'Sesión Jam',
      days: 'd',
    },
    home: {
      greeting: (name: string) => `Buenas noches, ${name}`,
      createParty: 'Crear Fiesta',
      yourParties: 'TUS FIESTAS',
      activeGatherings: 'Encuentros privados activos',
      upcomingCount: (count: number) => `${count} próximas`,
      liveNow: 'EN VIVO',
      joined: 'UNIDO',
      going: 'asistiendo',
      hostedBy: (host: string) => `Por ${host}`,
      yourCrews: 'TUS CREWS',
      permanentCircles: 'Círculos recurrentes de amigos',
      membersCount: (count: number) => `${count} miembros`,
      exploreCrews: 'Ver crews',
      swipeHint: 'Desliza horizontalmente para ver todas las fiestas',
      noParties: 'No tienes fiestas activas',
      createFirstParty: '¡Crea la primera y pásala en grande!',
    },
    joinParty: {
      joinCircle: 'ÚNETE AL CÍRCULO PRIVADO',
      gotACode: '¿TIENES UN CÓDIGO?',
      codeDescription: 'Ingresa el código de 4 caracteres que te compartió tu anfitrión para entrar a la fiesta.',
      privateAccessBadge: 'ACCESO PRIVADO',
      errorNotFound: 'No encontramos ninguna fiesta con este código. ¡Verifícalo con tu anfitrión!',
      testCodesHint: 'Códigos de prueba:',
      verifiedBadge: 'VERIFICADO EIP-712',
      hostLabel: (name: string) => `Organizado por ${name}`,
      enterPartyButton: 'Entrar a la fiesta',
      enteringButton: 'Entrando a la fiesta...',
      connectToJoin: 'Inicia sesión para entrar',
      invitationBadge: 'Invitación a la Fiesta',
      onTheList: '¡ESTÁS EN LA LISTA!',
      when: 'Cuándo',
      where: 'Dónde',
      peopleGoing: (count: number) => `${count} personas asistirán`,
      confirmedGuestlist: 'Confirmados en la fiesta',
      alreadyInParty: '¡Ya formas parte de esta fiesta!',
      enterParty: 'Entrar a la Fiesta',
      acceptAndJoin: 'Aceptar Invitación y Unirme',
      accepting: 'Aceptando invitación...',
      signInToAccept: 'Conectar para Aceptar Invitación',
      enterDifferentCode: '¿Quieres unirte con otro código? Toca aquí',
      invitedBy: (name: string) => `Invitado por el anfitrión ${name}`,
    },
    createParty: {
      back: 'Atrás',
      stepCount: (current: number, total: number) => `Paso ${current} de ${total}`,
      step1Title: '¿Cómo se llama la fiesta?',
      step1Subtitle: 'Elige un nombre icónico y el crew que organiza',
      step2Title: 'Portada del evento',
      step2Subtitle: 'Selecciona una estética visual con iluminación golden hour',
      step3Title: '¿Cuándo y dónde?',
      step3Subtitle: 'Fecha, hora y ubicación para tus invitados',
      step4Title: 'Detalles finales',
      step4Subtitle: 'Instrucciones, dress code o vibra de la noche',
      partyNameLabel: 'Nombre de la fiesta',
      partyNamePlaceholder: 'Ej. BALCÓN SECRETO · SESIÓN MONAD',
      crewLabel: 'Asociar a un Crew (Opcional)',
      noCrewOption: 'Sin crew específico',
      chooseCoverLabel: 'Elige una portada',
      dateLabel: 'Fecha',
      timeLabel: 'Hora',
      locationLabel: 'Lugar / Dirección',
      locationPlaceholder: 'Ej. Medellín · Terraza Poblado',
      descriptionLabel: 'Descripción / Vibe',
      descriptionPlaceholder: 'Ej. Sistema de audio listo, traigan lo que tomen, buena vibra.',
      nextStep: 'Siguiente',
      createPartyButton: 'Crear Fiesta en Monad',
      partyCreatedTitle: '¡FIESTA CREADA!',
      partyCreatedSubtitle: 'Tu evento está listo en Monad Testnet con enlace criptográfico EIP-712.',
      partyCodeLabel: 'CÓDIGO DE ENTRADA',
      copyCodeButton: 'Copiar Código',
      shareInviteButton: 'Compartir Invitación',
      goToPartyButton: 'Ir a los detalles de la fiesta',
    },
    partyDetail: {
      recap: 'Resumen',
      share: 'Compartir',
      codeLabel: (code: string) => `CÓDIGO: ${code}`,
      privateEvent: 'EVENTO PRIVADO',
      hostedBy: (host: string) => `Organizado por ${host}`,
      rsvpGoing: 'Voy',
      rsvpNotGoing: 'No voy',
      rsvpMaybe: 'Tal vez',
      aboutTheNight: 'SOBRE LA NOCHE',
      curatedBy: (host: string) => `Curado por ${host}`,
      sharedAlbum: 'Álbum compartido',
      photosCount: (count: number) => `${count} fotos`,
      addPhoto: 'Añadir foto',
      noPhotosYet: 'Sé el primero en subir un recuerdo',
      uploadMemory: 'Subir recuerdo al álbum',
      quickActions: {
        play: 'JUGAR',
        playSub: '3 minijuegos',
        split: 'DIVIDIR',
        splitSub: 'Calculadora de gastos',
        pot: 'POZO',
        potSub: (bal: string) => `$${bal} activo`,
        poll: 'VOTAR',
        pollSub: 'Votación en vivo',
      },
      bountiesTitle: 'Misiones y Recompensas',
      bountiesSubtitle: 'Gana MON ayudando con la fiesta',
      createBounty: 'Crear Misión',
    },
    privy: {
      welcomeTitle: 'Bienvenido a PartyLot',
      welcomeSubtitle: 'Entra al instante con tu cuenta preferida. Sin contraseñas ni configuraciones difíciles.',
      continueApple: 'Continuar con Apple',
      continueGoogle: 'Continuar con Google',
      continueEmail: 'Continuar con Email o Celular',
      connectWeb3: 'Conectar billetera externa / Web3',
      accessing: 'Accediendo...',
      secureAccessBadge: 'BILLETERA EMBEBIDA SEGURA · MONAD TESTNET',
      accountReadyTitle: 'Cuenta Lista',
      accountReadySubtitle: 'Tu perfil está listo para la fiesta.',
    },
    profile: {
      title: 'Tu Perfil',
      walletAddressLabel: 'DIRECCIÓN SMART WALLET (MONAD)',
      copyAddress: 'Copiar Dirección',
      languageSection: 'IDIOMA DE LA PLATAFORMA',
      sharedExperienceTitle: 'Grafo de Experiencias Compartidas',
      sharedExperienceSubtitle: 'Amistades forjadas a través de eventos, juegos y finanzas compartidas',
      gatherings: 'fiestas juntos',
      games: 'juegos',
      badgesTitle: 'INSIGNIAS Y LOGROS',
      pastNightsTitle: 'NOCHES ANTERIORES',
      resetData: 'Limpiar caché local',
      logout: 'Cerrar sesión',
      nightsMetric: 'Noches',
      gamesMetric: 'Juegos',
      peopleMetric: 'Personas',
      settledMetric: 'Pagos',
      nightsDetailTitle: 'Noches de Fiesta',
      nightsDetailDesc: 'Historial de fiestas y encuentros privados en los que has participado con tus crews.',
      gamesDetailTitle: 'Juegos y Desafíos',
      gamesDetailDesc: 'Rondas sociales jugadas en vivo: ¿Quién es más probable?, This or That y Trivia de Lore.',
      peopleDetailTitle: 'Círculo de Amigos',
      peopleDetailDesc: 'Personas reales con las que has compartido experiencias en persona. Sin seguidores falsos.',
      settledDetailTitle: 'Cuentas Saldadas',
      settledDetailDesc: 'Historial verificado de liquidaciones del daño y cuentas divididas saldadas a tiempo.',
      closeModal: 'Entendido',
    },
    onboarding: {
      welcomeBadge: 'NUEVO MIEMBRO · BIENVENIDO',
      howToCallYou: '¿Cómo quieres llamarte?',
      subtitle: 'Configura tu nombre y tu usuario único para que tus amigos te reconozcan en las fiestas.',
      nameLabel: '¿Cómo quieres llamarte?',
      namePlaceholder: 'Tu nombre o apodo (ej. Dani, Alex, Sofi)',
      usernameLabel: 'Elige tu @usuario',
      usernamePlaceholder: 'tu_usuario',
      uploadPhoto: 'Subir foto',
      choosePreset: 'O elige un avatar de fiesta',
      submitButton: 'Entrar a la fiesta',
      saving: 'Guardando tu perfil...',
      errorNameRequired: 'Por favor ingresa cómo quieres llamarte.',
      errorHandleInvalid: 'El @usuario debe tener entre 3 y 24 caracteres (letras, números o guión bajo).',
    },
    activityView: {
      subtitle: 'PULSO DE LA RED EN VIVO',
      title: 'Actividad de Fiesta',
      all: 'Toda la Actividad',
      rsvps: 'Confirmaciones',
      treasury: 'Fondo / Bote',
      games: 'Juegos y Trivia',
      polls: 'Votaciones',
      empty: 'No hay actividad en esta categoría todavía.',
      activeCircles: 'CÍRCULOS ACTIVOS',
      members: (count: number) => `${count} miembros`,
    },
    crews: {
      subtitle: 'REDES PRIVADAS DE CONFIANZA',
      title: 'Tus Crews',
      createCrew: 'Crear Crew',
      newGathering: 'Nueva Fiesta',
      membersCount: (count: number) => `${count} miembros`,
      partiesCount: (count: number) => `${count} fiestas`,
      nightsTogether: (count: number) => `${count} noches juntos`,
      treasuryBalance: 'Fondo Común',
      topGame: 'Juego Favorito',
      emptyTitle: 'No tienes crews todavía',
      emptySubtitle: 'Crea un crew para reunir a tus amigos en fiestas y eventos recurrentes.',
    },
    crewDetail: {
      back: 'Atrás',
      tabGatherings: 'Fiestas',
      tabMembers: 'Miembros',
      tabMemories: 'Recuerdos',
      treasury: 'Fondo del Crew',
      addMemory: 'Subir Foto',
      inviteMember: 'Invitar',
      copyLink: 'Copiar enlace',
      copied: '¡Copiado!',
      nightsTogether: (count: number) => `${count} noches juntos`,
      activeGatherings: 'Fiestas Activas',
      pastGatherings: 'Fiestas Anteriores',
      membersTitle: 'Miembros del Círculo',
      memoriesTitle: 'Álbum Compartido',
      noMemories: 'Aún no hay fotos guardadas en este crew.',
      captionPlaceholder: 'Escribe una dedicatoria o recuerdo...',
      uploading: 'Subiendo recuerdo...',
      saveMemory: 'Guardar Recuerdo',
    },
    split: {
      title: 'Dividir gastos',
      subtitle: 'Liquidación de cuentas entre amigos',
      totalSharedSpend: 'Total compartido',
      peopleUpdated: (count: number, time: string) => `${count} personas · Actualizado ${time}`,
      tabEqual: 'Equitativo',
      tabCustom: 'Personalizado',
      tabItems: 'Cuentas',
      youPaid: (amount: string) => `Pagaste $${amount}`,
      youWillReceive: 'Recibirás',
      owesYou: 'Te debe',
      alreadyPaid: 'Ya pagó',
      coveredDrinks: 'Cubrió tragos',
      expenseBreakdown: 'Desglose de gastos',
      viewAll: 'Ver todos',
      drinks: 'Tragos',
      snacks: 'Snacks',
      ride: 'Transporte',
      requestPayments: 'Solicitar pagos',
      editSplit: 'Editar división',
      addExpense: 'Añadir gasto',
      settleOnMonad: 'Liquidar en Monad (USDC)',
      settleSubtitle: 'Minimización matemática y liquidación web3',
      optionsTitle: 'Opciones de división',
      copyShareLink: 'Copiar enlace para compartir',
      categoryLabel: 'Categoría',
      descLabel: 'Descripción',
      amountLabel: 'Monto ($)',
      paidByLabel: 'Pagado por',
      splitBetweenLabel: 'Dividir entre',
      splitButton: 'Dividir gasto',
      settleTitle: 'Liquidación de Cuentas (USDC)',
      settleEngineBadge: 'USDC Split Engine · Monad Testnet',
      settleEngineDesc: 'Transferencias minimizadas con liquidación directa',
      settling: 'Liquidando en Monad...',
      confirmSettle: (count: number) => `Confirmar liquidación (${count} pagos en USDC)`,
    },
    partyPot: {
      potTitle: 'POZO DEL GRUPO',
      addUSDC: 'Aportar USDC',
      reward: 'Recompensa',
      spend: 'Gasto',
      rollover: 'Traspasar a Crew',
      balanceLabel: 'Fondo activo en USDC',
      recentTransactions: 'HISTORIAL DE FONDOS',
      all: 'Todos',
      deposits: 'Aportes',
      spends: 'Gastos',
      rewards: 'Premios',
      noTransactions: 'No hay transacciones registradas todavía.',
      addFundsModalTitle: 'Aportar al Fondo (USDC)',
      spendFundsModalTitle: 'Registrar Gasto del Fondo',
      rewardModalTitle: 'Premiar Rol de Fiesta',
      confirmDeposit: 'Confirmar Aporte (USDC)',
      confirmSpend: 'Confirmar Gasto',
      confirmReward: 'Enviar Recompensa',
      processing: 'Procesando en Monad...',
    },
    games: {
      gamesHeader: 'MINIJUEGOS DE FIESTA',
      mostLikely: 'Quién es más',
      thisOrThat: 'This or That',
      crewTrivia: 'Lore Trivia',
      fastDilemma: 'DILEMA RÁPIDO',
      pickSide: 'Elige tu bando. Porcentajes del grupo en vivo.',
      optionA: 'OPCIÓN A',
      optionB: 'OPCIÓN B',
      voted: 'VOTASTE',
      nextDilemma: 'Siguiente dilema',
      whosMostLikelyTitle: '¿QUIÉN ES MÁS PROBABLE QUE...',
      whosMostLikelySubtitle: 'Vota en secreto por alguien del grupo',
      yourVote: 'Tu voto',
      votes: 'votos',
      triviaTitle: 'LORE TRIVIA',
      triviaSubtitle: '¿Qué tan bien conoces las historias del grupo?',
      correct: '¡Correcto!',
      incorrect: 'Incorrecto',
      nextQuestion: 'Siguiente pregunta',
    },
    polls: {
      title: 'VOTACIONES DE GRUPO',
      subtitle: 'Decisiones democráticas en tiempo real',
      createPoll: 'Crear Votación',
      newPollTitle: 'Nueva Votación',
      questionLabel: 'Pregunta',
      questionPlaceholder: 'ej. ¿A qué hora nos vamos? ¿Dónde es el after?',
      optionsLabel: 'Opciones',
      addOption: 'Añadir opción',
      publish: 'Publicar votación',
      vote: 'Votar',
      votedBadge: 'Votado',
      totalVotes: (count: number) => `${count} votos`,
      empty: 'No hay votaciones activas en esta fiesta todavía.',
    },
    recap: {
      badge: 'LA MAÑANA SIGUIENTE',
      title: 'Resumen de la Noche',
      attest: 'Atestar en Monad',
      attesting: 'Atestando en Monad...',
      attested: 'Atestado en Monad',
      download: 'Descargar Póster',
      totalDamage: 'GASTO TOTAL',
      memoriesCount: 'FOTOS COMPARTIDAS',
      gamesPlayed: 'RONDAS JUGADAS',
      peopleAttended: 'ASISTENTES',
      mvpTitle: 'ALMA DE LA FIESTA',
    },
  },
  en: {
    common: {
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      confirm: 'Confirm',
      copy: 'Copy',
      copied: 'Copied!',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      share: 'Share',
      close: 'Close',
      privateEvent: 'PRIVATE EVENT',
      online: 'Online',
      hostedBy: 'Hosted by',
      language: 'Language',
      switchLanguage: 'Switch to Spanish',
    },
    nav: {
      home: 'Home',
      crews: 'Crews',
      activity: 'Activity',
      profile: 'Profile',
    },
    splash: {
      welcomeTo: 'WELCOME TO',
      tagline: 'Create stylish invitations and share them for any event',
      createEvent: 'Create an event',
      haveInviteCode: 'I have an invite code',
      privateAccess: 'Private access · Zero fees, zero ads',
      rooftopParty: 'Rooftop Party',
      cocktailsNight: 'Cocktails Night',
      newYorkJam: 'New York Jam',
      days: 'd',
    },
    home: {
      greeting: (name: string) => `Good evening, ${name}`,
      createParty: 'Create Party',
      yourParties: 'YOUR PARTIES',
      activeGatherings: 'Active private gatherings',
      upcomingCount: (count: number) => `${count} upcoming`,
      liveNow: 'LIVE NOW',
      joined: 'JOINED',
      going: 'going',
      hostedBy: (host: string) => `Hosted by ${host}`,
      yourCrews: 'YOUR CREWS',
      permanentCircles: 'Recurring friend circles',
      membersCount: (count: number) => `${count} members`,
      exploreCrews: 'Explore crews',
      swipeHint: 'Swipe horizontally to explore upcoming gatherings',
      noParties: 'No active parties yet',
      createFirstParty: 'Create your first party and invite your crew!',
    },
    joinParty: {
      joinCircle: 'JOIN PRIVATE CIRCLE',
      gotACode: 'GOT A CODE?',
      codeDescription: 'Enter the 4-character invite code provided by your host to join the party.',
      privateAccessBadge: 'PRIVATE ACCESS',
      errorNotFound: 'No party found with this code. Double-check with your host!',
      testCodesHint: 'Try test codes:',
      verifiedBadge: 'EIP-712 VERIFIED',
      hostLabel: (name: string) => `Hosted by ${name}`,
      enterPartyButton: 'Enter Party',
      enteringButton: 'Entering Party...',
      connectToJoin: 'Sign in to join',
      invitationBadge: 'Party Invitation',
      onTheList: "YOU'RE ON THE LIST!",
      when: 'When',
      where: 'Where',
      peopleGoing: (count: number) => `${count} people going`,
      confirmedGuestlist: 'Confirmed on guestlist',
      alreadyInParty: "You're already in this party!",
      enterParty: 'Enter Party Details',
      acceptAndJoin: 'Accept Invite & Join',
      accepting: 'Accepting invite...',
      signInToAccept: 'Sign in to Accept Invite',
      enterDifferentCode: 'Want to enter a different code? Tap here',
      invitedBy: (name: string) => `Invited by host ${name}`,
    },
    createParty: {
      back: 'Back',
      stepCount: (current: number, total: number) => `Step ${current} of ${total}`,
      step1Title: "What's the party called?",
      step1Subtitle: 'Pick an iconic name and the hosting crew',
      step2Title: 'Party Cover Art',
      step2Subtitle: 'Select a visual aesthetic with golden-hour lighting',
      step3Title: 'When & Where?',
      step3Subtitle: 'Date, time, and address for your guests',
      step4Title: 'Final Details',
      step4Subtitle: 'Instructions, dress code, or night vibe',
      partyNameLabel: 'Party Name',
      partyNamePlaceholder: 'e.g. SECRET BALCONY · MONAD SESSION',
      crewLabel: 'Link to a Crew (Optional)',
      noCrewOption: 'No specific crew',
      chooseCoverLabel: 'Choose a cover',
      dateLabel: 'Date',
      timeLabel: 'Time',
      locationLabel: 'Location / Venue',
      locationPlaceholder: 'e.g. Medellín · Rooftop Poblado',
      descriptionLabel: 'Description / Vibe',
      descriptionPlaceholder: 'e.g. Sound system ready, BYOB, good vibes only.',
      nextStep: 'Next',
      createPartyButton: 'Create Party on Monad',
      partyCreatedTitle: 'PARTY CREATED!',
      partyCreatedSubtitle: 'Your party is live on Monad Testnet with cryptographic EIP-712 permit.',
      partyCodeLabel: 'ENTRY CODE',
      copyCodeButton: 'Copy Code',
      shareInviteButton: 'Share Invitation',
      goToPartyButton: 'Go to Party Details',
    },
    partyDetail: {
      recap: 'Recap',
      share: 'Share',
      codeLabel: (code: string) => `CODE: ${code}`,
      privateEvent: 'PRIVATE EVENT',
      hostedBy: (host: string) => `Hosted by ${host}`,
      rsvpGoing: 'Going',
      rsvpNotGoing: 'Not going',
      rsvpMaybe: 'Maybe',
      aboutTheNight: 'ABOUT THE NIGHT',
      curatedBy: (host: string) => `Curated by ${host}`,
      sharedAlbum: 'Shared album',
      photosCount: (count: number) => `${count} photos`,
      addPhoto: 'Add photo',
      noPhotosYet: 'Be the first to share a memory',
      uploadMemory: 'Upload party memory',
      quickActions: {
        play: 'PLAY',
        playSub: '3 minigames',
        split: 'SPLIT',
        splitSub: 'Damage calculator',
        pot: 'POT',
        potSub: (bal: string) => `$${bal} active`,
        poll: 'POLL',
        pollSub: 'Live voting',
      },
      bountiesTitle: 'Party Bounties & Tasks',
      bountiesSubtitle: 'Earn MON by helping out the party',
      createBounty: 'Create Task',
    },
    privy: {
      welcomeTitle: 'Welcome to PartyLot',
      welcomeSubtitle: 'Instant access with your favorite account. No passwords, no seed phrases, no friction.',
      continueApple: 'Continue with Apple',
      continueGoogle: 'Continue with Google',
      continueEmail: 'Continue with Email or Phone',
      connectWeb3: 'Connect External Web3 Wallet',
      accessing: 'Accessing...',
      secureAccessBadge: 'SECURE EMBEDDED WALLET · MONAD TESTNET',
      accountReadyTitle: 'Account Ready',
      accountReadySubtitle: 'Your profile is ready for the night.',
    },
    profile: {
      title: 'Your Profile',
      walletAddressLabel: 'SMART WALLET ADDRESS (MONAD)',
      copyAddress: 'Copy Address',
      languageSection: 'PLATFORM LANGUAGE',
      sharedExperienceTitle: 'Shared Experience Graph',
      sharedExperienceSubtitle: 'Friendships forged across gatherings, minigames, and settlements',
      gatherings: 'gatherings together',
      games: 'games',
      badgesTitle: 'BADGES & MILESTONES',
      pastNightsTitle: 'PAST NIGHTS',
      resetData: 'Clear local cache',
      logout: 'Log out',
      nightsMetric: 'Nights',
      gamesMetric: 'Games',
      peopleMetric: 'People',
      settledMetric: 'Settled',
      nightsDetailTitle: 'Party Nights',
      nightsDetailDesc: 'Verified history of private parties and gatherings attended with your crews.',
      gamesDetailTitle: 'Games & Challenges',
      gamesDetailDesc: 'Live social game rounds played: Who’s Most Likely, This or That, and Lore Trivia.',
      peopleDetailTitle: 'Friend Circle',
      peopleDetailDesc: 'Authentic people you have spent real-world time with. Zero vanity followers.',
      settledDetailTitle: 'Settled Expenses',
      settledDetailDesc: 'Track record of group expense splits settled on-time without awkward debts.',
      closeModal: 'Got it',
    },
    onboarding: {
      welcomeBadge: 'NEW MEMBER · WELCOME',
      howToCallYou: 'What should we call you?',
      subtitle: 'Set up your name and unique @handle so your friends can recognize you at gatherings.',
      nameLabel: 'What should we call you?',
      namePlaceholder: 'Your name or nickname (e.g. Alex, Sam)',
      usernameLabel: 'Choose your @username',
      usernamePlaceholder: 'your_username',
      uploadPhoto: 'Upload photo',
      choosePreset: 'Or pick a party preset avatar',
      submitButton: 'Enter the Party',
      saving: 'Saving your profile...',
      errorNameRequired: 'Please enter your name or nickname.',
      errorHandleInvalid: 'Username must be between 3 and 24 characters (letters, numbers, or underscore).',
    },
    activityView: {
      subtitle: 'LIVE NETWORK PULSE',
      title: 'Party Activity',
      all: 'All Activity',
      rsvps: 'RSVPs',
      treasury: 'Treasury',
      games: 'Games & Trivia',
      polls: 'Polls',
      empty: 'No activity under this category yet.',
      activeCircles: 'ACTIVE CREW CIRCLES',
      members: (count: number) => `${count} members`,
    },
    crews: {
      subtitle: 'PRIVATE TRUST NETWORKS',
      title: 'Your Crews',
      createCrew: 'Create Crew',
      newGathering: 'New Gathering',
      membersCount: (count: number) => `${count} members`,
      partiesCount: (count: number) => `${count} parties`,
      nightsTogether: (count: number) => `${count} nights together`,
      treasuryBalance: 'Treasury Balance',
      topGame: 'Top Game',
      emptyTitle: 'No crews yet',
      emptySubtitle: 'Create a crew to gather your friends for recurring gatherings and parties.',
    },
    crewDetail: {
      back: 'Back',
      tabGatherings: 'Gatherings',
      tabMembers: 'Members',
      tabMemories: 'Memories',
      treasury: 'Crew Treasury',
      addMemory: 'Add Photo',
      inviteMember: 'Invite',
      copyLink: 'Copy link',
      copied: 'Copied!',
      nightsTogether: (count: number) => `${count} nights together`,
      activeGatherings: 'Active Gatherings',
      pastGatherings: 'Past Gatherings',
      membersTitle: 'Crew Members',
      memoriesTitle: 'Shared Memories',
      noMemories: 'No memories shared yet in this crew.',
      captionPlaceholder: 'Write a caption for this memory...',
      uploading: 'Uploading memory...',
      saveMemory: 'Save Memory',
    },
    split: {
      title: 'Split expenses',
      subtitle: 'Damage calculator between friends',
      totalSharedSpend: 'Total shared spend',
      peopleUpdated: (count: number, time: string) => `${count} people · Updated ${time}`,
      tabEqual: 'Equal',
      tabCustom: 'Custom',
      tabItems: 'Items',
      youPaid: (amount: string) => `You paid $${amount}`,
      youWillReceive: 'You will receive',
      owesYou: 'Owes you',
      alreadyPaid: 'Already paid',
      coveredDrinks: 'Covered drinks',
      expenseBreakdown: 'Expense breakdown',
      viewAll: 'View all',
      drinks: 'Drinks',
      snacks: 'Snacks',
      ride: 'Ride',
      requestPayments: 'Request payments',
      editSplit: 'Edit split',
      addExpense: 'Add expense',
      settleOnMonad: 'Settle on Monad (USDC)',
      settleSubtitle: 'Greedy algorithm & web3 settlement',
      optionsTitle: 'Split Options',
      copyShareLink: 'Copy share link',
      categoryLabel: 'Category',
      descLabel: 'Description',
      amountLabel: 'Amount ($)',
      paidByLabel: 'Paid by',
      splitBetweenLabel: 'Split between',
      splitButton: 'Split Expense',
      settleTitle: 'Request & Settle Payments',
      settleEngineBadge: 'USDC Split Engine · Monad Testnet',
      settleEngineDesc: 'Greedy minimal debt minimization & settlement',
      settling: 'Settling on Monad...',
      confirmSettle: (count: number) => `Confirm settlement (${count} payments in USDC)`,
    },
    partyPot: {
      potTitle: 'PARTY POT',
      addUSDC: 'Add USDC',
      reward: 'Reward',
      spend: 'Spend',
      rollover: 'Rollover to Crew',
      balanceLabel: 'Active USDC Balance',
      recentTransactions: 'TREASURY HISTORY',
      all: 'All',
      deposits: 'Deposits',
      spends: 'Expenses',
      rewards: 'Rewards',
      noTransactions: 'No transactions recorded yet.',
      addFundsModalTitle: 'Deposit Funds (USDC)',
      spendFundsModalTitle: 'Log Treasury Expense',
      rewardModalTitle: 'Reward Party Role',
      confirmDeposit: 'Confirm Deposit (USDC)',
      confirmSpend: 'Confirm Expense',
      confirmReward: 'Send Reward',
      processing: 'Processing on Monad...',
    },
    games: {
      gamesHeader: 'PARTY MINIGAMES',
      mostLikely: 'Most Likely',
      thisOrThat: 'This or That',
      crewTrivia: 'Crew Trivia',
      fastDilemma: 'FAST DILEMMA',
      pickSide: 'Pick your side. Live group ratio.',
      optionA: 'OPTION A',
      optionB: 'OPTION B',
      voted: 'YOU VOTED',
      nextDilemma: 'Next dilemma',
      whosMostLikelyTitle: 'WHO IS MOST LIKELY TO...',
      whosMostLikelySubtitle: 'Secretly vote for someone in the group',
      yourVote: 'Your vote',
      votes: 'votes',
      triviaTitle: 'LORE TRIVIA',
      triviaSubtitle: 'How well do you know the crew lore?',
      correct: 'Correct!',
      incorrect: 'Incorrect',
      nextQuestion: 'Next question',
    },
    polls: {
      title: 'GROUP POLLS',
      subtitle: 'Realtime democratic decisions',
      createPoll: 'Create Poll',
      newPollTitle: 'New Poll',
      questionLabel: 'Question',
      questionPlaceholder: 'e.g. What time are we heading out? Where is the after?',
      optionsLabel: 'Options',
      addOption: 'Add option',
      publish: 'Publish poll',
      vote: 'Vote',
      votedBadge: 'Voted',
      totalVotes: (count: number) => `${count} votes`,
      empty: 'No active polls in this party yet.',
    },
    recap: {
      badge: 'THE MORNING AFTER',
      title: 'Party Recap',
      attest: 'Attest on Monad',
      attesting: 'Attesting on Monad...',
      attested: 'Attested on Monad',
      download: 'Download Poster',
      totalDamage: 'TOTAL DAMAGE',
      memoriesCount: 'SHARED PHOTOS',
      gamesPlayed: 'GAMES PLAYED',
      peopleAttended: 'PEOPLE ATTENDED',
      mvpTitle: 'PARTY MVP',
    },
  },
};
