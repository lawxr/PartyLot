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
    },
  },
};
