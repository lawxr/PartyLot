import type { TriviaQuestion, WhosMostLikelyQuestion, ThisOrThatQuestion } from '@/types';

/**
 * Minigame Question Banks
 * Default questions for PartyLot interactive party games.
 */

export const WHOS_MOST_LIKELY_QUESTIONS: WhosMostLikelyQuestion[] = [
  {
    id: 'wml-0',
    question: "Who's most likely to dance on a table tonight?",
    questionEs: '¿Quién es más probable que baile sobre la mesa esta noche?',
    votes: {},
  },
  {
    id: 'wml-1',
    question: 'Who is most likely to disappear for three days and come back like nothing happened?',
    questionEs: '¿Quién es más probable que desaparezca tres días y regrese como si nada?',
    votes: {},
  },
  {
    id: 'wml-2',
    question: 'Who is most likely to DJ all night and refuse to pass the aux cord?',
    questionEs: '¿Quién es más probable que sea el DJ toda la noche y se niegue a soltar el cable auxiliar?',
    votes: {},
  },
  {
    id: 'wml-3',
    question: 'Who is most likely to adopt a stray animal on the way home?',
    questionEs: '¿Quién es más probable que adopte un animal callejero de camino a casa?',
    votes: {},
  },
  {
    id: 'wml-4',
    question: 'Who is most likely to order $150 worth of midnight delivery for themselves?',
    questionEs: '¿Quién es más probable que pida $150 en delivery a medianoche solo para sí mismo?',
    votes: {},
  },
];

export const THIS_OR_THAT_QUESTIONS: ThisOrThatQuestion[] = [
  {
    id: 'tot-1',
    optionA: 'BEACH SUNRISE',
    optionB: 'ROOFTOP 4AM',
    optionAEs: 'AMANECER EN LA PLAYA',
    optionBEs: 'ROOFTOP A LAS 4AM',
    votesA: 0,
    votesB: 0,
  },
  {
    id: 'tot-2',
    optionA: 'TEQUILA SHOTS',
    optionB: 'DIRTY GIN MARTINI',
    optionAEs: 'SHOTS DE TEQUILA',
    optionBEs: 'MARTINI DE GINEBRA',
    votesA: 0,
    votesB: 0,
  },
  {
    id: 'tot-3',
    optionA: 'AFTERPARTY TILL NOON',
    optionB: 'BED & COMFORT FOOD',
    optionAEs: 'AFTER HASTA EL MEDIODÍA',
    optionBEs: 'CAMA Y COMIDA RICA',
    votesA: 0,
    votesB: 0,
  },
  {
    id: 'tot-4',
    optionA: 'UNRELEASED TECHNO',
    optionB: '2000s REGGAETON CLASSICS',
    optionAEs: 'TECHNO INÉDITO',
    optionBEs: 'CLÁSICOS DE REGGAETÓN 2000',
    votesA: 0,
    votesB: 0,
  },
];

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 't-1',
    question: 'Who once accidentally locked everyone on the balcony during a rainstorm?',
    questionEs: '¿Quién encerró accidentalmente a todos en el balcón durante una tormenta?',
    options: ['Carlos', 'Ana', 'Law', 'Sofi'],
    optionsEs: ['Carlos', 'Ana', 'Law', 'Sofi'],
    correctIndex: 0,
    explanation: 'Carlos tried to shut out the smoke alarm and locked the latch!',
    explanationEs: '¡Carlos intentó callar la alarma de humo y cerró el pestillo por error!',
  },
  {
    id: 't-2',
    question: 'What is the unofficial house cocktail recipe invented at 404?',
    questionEs: '¿Cuál es la receta del cóctel no oficial de la casa inventado en 404?',
    options: ['Mezcal + Grapefruit + Spicy Salt', 'Vodka + Cold Brew + Red Bull', 'Tequila + Champagne + Lime', 'Gin + Coconut Water + Matcha'],
    optionsEs: ['Mezcal + Toronja + Sal Picante', 'Vodka + Cold Brew + Red Bull', 'Tequila + Champaña + Limón', 'Ginebra + Agua de Coco + Matcha'],
    correctIndex: 2,
    explanation: 'The famous "Golden Spark" – lethal and bubbly.',
    explanationEs: 'El famoso "Golden Spark": letal y burbujeante.',
  },
  {
    id: 't-3',
    question: 'How many slices of pizza were consumed in a single night at the last gathering?',
    questionEs: '¿Cuántas porciones de pizza se comieron en una sola noche en la última fiesta?',
    options: ['18 slices', '32 slices', '48 slices', 'Who was counting?'],
    optionsEs: ['18 porciones', '32 porciones', '48 porciones', '¿Quién las contaba?'],
    correctIndex: 2,
    explanation: '6 full large pizzas completely demolished by 2:30 AM.',
    explanationEs: '6 pizzas familiares terminadas antes de las 2:30 AM.',
  },
  {
    id: 't-4',
    question: 'Which crew member holds the record for fastest RSVP (under 4 seconds)?',
    questionEs: '¿Qué miembro de la crew tiene el récord del RSVP más rápido (menos de 4 seg)?',
    options: ['Law', 'Ana', 'Mateo', 'Valen'],
    optionsEs: ['Law', 'Ana', 'Mateo', 'Valen'],
    correctIndex: 1,
    explanation: 'Ana got the push notification and pressed going before the app finished loading.',
    explanationEs: 'Ana vio la notificación push y confirmó asistencia antes de que cargara la pantalla.',
  },
  {
    id: 't-5',
    question: 'Where was the original Partylot prototype sketched on a napkin?',
    questionEs: '¿Dónde se dibujó en una servilleta el prototipo original de Partylot?',
    options: ['Rooftop in Medellín', 'Tokyo ramen shop', 'Berlin club line', 'Bogotá café'],
    optionsEs: ['Rooftop en Medellín', 'Puesto de ramen en Tokio', 'Fila de club en Berlín', 'Café en Bogotá'],
    correctIndex: 0,
    explanation: 'Drawn on a cocktail napkin during a 3AM balcony session.',
    explanationEs: 'Dibujado en una servilleta durante una charla de balcón a las 3 AM.',
  },
];
