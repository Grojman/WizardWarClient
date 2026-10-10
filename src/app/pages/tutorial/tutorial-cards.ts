import { SPELL, UNIT } from '../../core/config/game-data-config';

// Text in the tutorial is hardcoded on the client so it never needs the
// server; it's picked by the same language code the rest of the app uses.
export type TutorialLanguage = 'es' | 'en';
export type LocalizedText = Record<TutorialLanguage, string>;

// Static data of a real card, copied from the server's MockData / cards.csv
// (serverId, stats, families and its translated name/description), so the
// tutorial shows exactly what a real match would.
export interface TutorialCardDefinition {
  serverId: string;
  type: string;
  attack: number;
  health: number;
  families: LocalizedText[];
  name: LocalizedText;
  description: LocalizedText;
  // Uses of its ability (0 = no ability).
  effectTimes: number;
  // Play condition counting played copies of another card, if any.
  condition?: { countServerId: string; target: number };
}

const FAMILY = {
  RATA: { es: 'Rata', en: 'Rat' },
  CENIZA: { es: 'Ceniza', en: 'Ash' },
  BRUJO: { es: 'Brujo', en: 'Warlock' },
  LEYENDA: { es: 'Leyenda', en: 'Legend' },
  DRAGON: { es: 'Dragón', en: 'Dragon' },
  LIBRO: { es: 'Libro', en: 'Book' },
  PARANOIA: { es: 'Paranoia', en: 'Paranoia' },
  CASTELLANO: { es: 'Castellano', en: 'Castilian' },
  CABALLO: { es: 'Caballo', en: 'Horse' },
  CABALLERO: { es: 'Caballero', en: 'Knight' },
} satisfies Record<string, LocalizedText>;

export const TUTORIAL_CARDS: Record<string, TutorialCardDefinition> = {
  '27': {
    serverId: '27',
    type: SPELL,
    attack: 0,
    health: 0,
    families: [FAMILY.CENIZA],
    name: { es: 'Bola de fuego', en: 'Fireball' },
    description: {
      es: 'Inflinjo -4 a la primera unidad de la izquierda en la {board:mesa} del {rival:rival}.',
      en: "I deal -4 to the leftmost unit on the {rival:rival}'s {board:board}.",
    },
    effectTimes: 0,
  },
  '65': {
    serverId: '65',
    type: UNIT,
    attack: 2,
    health: 1,
    families: [FAMILY.LEYENDA, FAMILY.DRAGON],
    name: { es: 'Cría de dragón', en: 'Dragon Hatchling' },
    description: {
      es: '{skill:HABILIDAD}: quito 1 de vida al {rival:rival} y se lo otorgo a mi {player:jugador}',
      en: '{skill:SKILL}: I take 1 life from the {rival:rival} and grant it to my {player:player}',
    },
    effectTimes: 1,
  },
  '13': {
    serverId: '13',
    type: SPELL,
    attack: 0,
    health: 0,
    families: [FAMILY.RATA],
    name: { es: 'Mordedura de rata', en: 'Rat Bite' },
    description: {
      es: '[0/-3] a una unidad en la {board:mesa} {rival:rival}, la primera a la izquierda. {skill:HABILIDAD}: {draw:roba} una carta',
      en: '[0/-3] to a unit on the {rival:rival} {board:board}, the first one on the left. {skill:SKILL}: {draw:draw} a card',
    },
    effectTimes: 1,
  },
  '29': {
    serverId: '29',
    type: UNIT,
    attack: 6,
    health: 7,
    families: [FAMILY.BRUJO, FAMILY.CENIZA],
    name: { es: 'Maestro de la ceniza', en: 'Master of Ash' },
    description: {
      es: '{condition:Has {play:jugado} 5 bolas de fuego o más}. {endround:Fin de Ronda}: {add:creo} una bola de fuego en el mazo de mi {player:jugador}',
      en: "{condition:You must have {play:played} 5 or more fireballs}. {endround:End of Round}: I {add:create} a fireball in my {player:player}'s deck",
    },
    effectTimes: 0,
    condition: { countServerId: '27', target: 5 },
  },
  '7': {
    serverId: '7',
    type: SPELL,
    attack: 0,
    health: 0,
    families: [],
    name: { es: 'Queso', en: 'Cheese' },
    description: {
      es: 'Curo 3 de vida a mi {player:jugador}',
      en: 'I heal my {player:player} for 3 life',
    },
    effectTimes: 0,
  },
  '30': {
    serverId: '30',
    type: UNIT,
    attack: 2,
    health: 3,
    families: [FAMILY.CENIZA],
    name: { es: 'Espíritu del fuego', en: 'Spirit of Fire' },
    description: {
      es: 'Cuando mi {player:jugador} {play:juega} una bola de fuego, inflinjo 2 de daño al {play:rival}',
      en: 'When my {player:player} {play:plays} a fireball, I deal 2 damage to the {play:rival}',
    },
    effectTimes: 0,
  },
  '28': {
    serverId: '28',
    type: UNIT,
    attack: 2,
    health: 1,
    families: [FAMILY.BRUJO],
    name: { es: 'Aprendiz de mago', en: "Wizard's Apprentice" },
    description: {
      es: 'Cuando mi {player:jugador} me {play:juega}, {add:creo} una bola de fuego en su {deck:mazo}',
      en: 'When my {player:player} {play:plays} me, I {add:create} a fireball in their {deck:deck}',
    },
    effectTimes: 0,
  },
  '14': {
    serverId: '14',
    type: SPELL,
    attack: 0,
    health: 0,
    families: [FAMILY.LIBRO],
    name: { es: 'Libro de Caballería', en: 'Book of Chivalry' },
    description: {
      es: '{draw:Roba} una carta y cura 2 de vida a mi {player:jugador}',
      en: '{draw:Draw} a card and heal my {player:player} for 2 life',
    },
    effectTimes: 0,
  },
  '16': {
    serverId: '16',
    type: UNIT,
    attack: 2,
    health: 2,
    families: [FAMILY.PARANOIA],
    name: { es: 'Molino de viento', en: 'Windmill' },
    description: { es: '', en: '' },
    effectTimes: 0,
  },
  '17': {
    serverId: '17',
    type: UNIT,
    attack: 1,
    health: 1,
    families: [FAMILY.PARANOIA],
    name: { es: 'Rebaño de corderos', en: 'Flock of Lambs' },
    description: { es: '', en: '' },
    effectTimes: 0,
  },
  '21': {
    serverId: '21',
    type: UNIT,
    attack: 2,
    health: 2,
    families: [FAMILY.CABALLO],
    name: { es: 'Rocinante', en: 'Rocinante' },
    description: {
      es: 'Cuando mi {player:jugador} {play:juega} a Don Quijote, consigo [+2/+2]',
      en: 'When my {player:player} {play:plays} Don Quixote, I get [+2/+2]',
    },
    effectTimes: 0,
  },
  '24': {
    serverId: '24',
    type: UNIT,
    attack: 1,
    health: 4,
    families: [FAMILY.CASTELLANO],
    name: { es: 'Cura Pero Pérez', en: 'Priest Pero Pérez' },
    description: {
      es: '{endround:Fin de ronda}: {add:Creo} un Libro de Caballería en el {deck:mazo} de mi {player:jugador}',
      en: "{endround:End of round}: I {add:create} a Book of Chivalry in my {player:player}'s {deck:deck}",
    },
    effectTimes: 0,
  },
  '26': {
    serverId: '26',
    type: UNIT,
    attack: 1,
    health: 5,
    families: [FAMILY.CASTELLANO],
    name: { es: 'Sancho Panza', en: 'Sancho Panza' },
    description: {
      es: '{endround:Fin de Ronda}: Si no hay otros {family:Castellanos} en la {board:mesa} de mi {player:jugador}, [0/-1] a la {board:mesa}. {skill:HABILIDAD}: [+1/+1] a las unidades la {board:mesa} de mi {player:jugador}',
      en: "{endround:End of Round}: If there are no other {family:Castilians} on my {player:player}'s {board:board}, [0/-1] to the {board:board}. {skill:SKILL}: [+1/+1] to the units on my {player:player}'s {board:board}",
    },
    effectTimes: 1,
  },
  '18': {
    serverId: '18',
    type: UNIT,
    attack: 3,
    health: 1,
    families: [FAMILY.PARANOIA, FAMILY.CASTELLANO],
    name: { es: 'Dulcinea del Toboso', en: 'Dulcinea del Toboso' },
    description: {
      es: '{endround:Final de ronda}: [+2/+3] a Don Quijote, si se encuentra en {board:mesa}',
      en: '{endround:End of round}: [+2/+3] to Don Quixote, if he is on the {board:board}',
    },
    effectTimes: 0,
  },
  '23': {
    serverId: '23',
    type: UNIT,
    attack: 2,
    health: 3,
    families: [FAMILY.CABALLERO],
    name: { es: 'El caballero de la blanca luna', en: 'The Knight of the White Moon' },
    description: {
      es: 'Cuando {die:muero}, las próximas dos unidades que {play:juegue} mi {player:jugador} consiguen [+1/-1]',
      en: 'When I {die:die}, the next two units my {player:player} {play:plays} get [+1/-1]',
    },
    effectTimes: 0,
  },
};

// Endless Winter's (card 61) global effect, which the player starts the
// tutorial with so the effects panel has something real to show.
export const ENDLESS_WINTER_EFFECT = {
  serverId: '61',
  rounds: 2,
  text: {
    es: 'Durante los próximos dos finales de ronda, -1/0 a la mesa enemiga',
    en: 'For the next 2 ends of round, -1/0 to the enemy board',
  } as LocalizedText,
};
