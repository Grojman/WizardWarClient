import { LocalizedText } from './tutorial-cards';

// Every line the tutorial shows, keyed by id. Kept on the client (rather than
// in the server's translations.csv) so the tutorial works fully offline.
export const TUTORIAL_TEXT = {
  // ---------- UI ----------
  CONTINUE: { es: 'Haz clic para continuar', en: 'Click to continue' },
  NEXT: { es: 'Siguiente', en: 'Next' },
  SKIP: { es: 'Salir del tutorial', en: 'Leave tutorial' },
  YOUR_TURN: { es: 'Tu turno', en: 'Your turn' },
  RIVAL_TURN: { es: 'Turno rival', en: "Rival's turn" },
  WRONG_ACTION: {
    es: '¡Ahí no! Sigue las instrucciones del recuadro.',
    en: 'Not that! Follow the instructions in the box.',
  },
  ME_NAME: { es: 'Aprendiz', en: 'Apprentice' },
  RIVAL_NAME: { es: 'Mago tabernero', en: 'Tavern wizard' },
  CHAT_REPLY: {
    es: '¡Ja! Primero aprende a jugar y luego hablamos.',
    en: 'Ha! Learn to play first, then we can talk.',
  },

  // ---------- Intro ----------
  INTRO_1_TITLE: { es: '¡Bienvenido a El Bar de los Magos!', en: 'Welcome to El Bar de los Magos!' },
  INTRO_1_TEXT: {
    es: 'Dos magos, una mesa de taberna y dos cervezas en juego. Más te vale prestarme atención si no quieres pagar la siguiente ronda',
    en: "Two wizards, one tavern table and 2 beers in stake. You better listen to what I am going to say, if you don't want to pay the next round",
  },
  INTRO_2_TITLE: { es: 'Cartas y hechizos', en: 'Cards and spells' },
  INTRO_2_TEXT: {
    es: 'Cada mago juega cartas de su mazo: unidades que luchan por él y hechizos de efecto inmediato. Si te quedas a 0 de vida o sin cartas en el mazo, pierdes.',
    en: "Each wizard plays cards from their deck: units that fight for them and spells with instant effects. If you get to 0 life or without cards on the deck, you lose. ",
  },
  INTRO_3_TITLE: { es: 'Primero, la mesa', en: 'First, the table' },
  INTRO_3_TEXT: {
    es: 'Vamos a repartir las cartas y a repasar todo lo que tienes delante.',
    en: "Let's deal the cards and go over everything in front of you.",
  },

  // ---------- The table ----------
  HEALTH_TITLE: { es: 'Vida', en: 'Health' },
  HEALTH_TEXT: {
    es: 'Este barril es tu vida. Empiezas con 20 puntos y, si llega a 0, pierdes la partida.',
    en: 'This barrel is your health. You start with 20 points and, if it reaches 0, you lose.',
  },
  RIVAL_HEALTH_TITLE: { es: 'Vida del rival', en: "Rival's health" },
  RIVAL_HEALTH_TEXT: {
    es: 'Y este es el barril del rival. Tu objetivo: vaciarlo antes de que él vacíe el tuyo.',
    en: "And this is your rival's barrel. Your goal: empty it before they empty yours.",
  },
  HAND_TITLE: { es: 'Mano', en: 'Hand' },
  HAND_TEXT: {
    es: 'Tus cartas. Solo tú las ves: del rival solo verás el dorso. Puedes tener 10 como máximo (el contador te dice cuántas llevas) y las que aparecen oscurecidas aún no se pueden jugar.',
    en: "Your cards. Only you can see them: you'll only see the back of your rival's. You can hold 10 at most (the counter tells you how many you have) and darkened ones can't be played yet.",
  },
  DECK_TITLE: { es: 'Mazo', en: 'Deck' },
  DECK_TEXT: {
    es: 'Tu mazo. Pasa el ratón por encima para ver cuántas cartas le quedan. ¡Cuidado! Si tienes que robar y está vacío, pierdes la partida.',
    en: "Your deck. Hover it to see how many cards are left. Careful! If you have to draw and it's empty, you lose the game.",
  },
  BOARD_TITLE: { es: 'Mesa', en: 'Board' },
  BOARD_TEXT: {
    es: 'Tus cuatro huecos para unidades. Las unidades se quedan aquí hasta que mueren. En cada carta, el número de la izquierda es su ataque y el de la derecha, su vida.',
    en: 'Your four unit slots. Units stay here until they die. On each card, the left number is its attack and the right one its health.',
  },
  LAST_SPELL_TITLE: { es: 'Último hechizo jugado', en: 'Last spell played' },
  LAST_SPELL_TEXT: {
    es: 'Aquí se queda el último hechizo que hayas lanzado. Si tiene una habilidad, podrás usarla desde este hueco.',
    en: 'The last spell you cast stays here. If it has an ability, you can use it from this slot.',
  },
  EFFECTS_TITLE: { es: 'Efectos', en: 'Effects' },
  EFFECTS_TEXT: {
    es: 'Los efectos que duran varias rondas se listan aquí. Los efectos son independientes a las cartas que los han lanzado. Mira, te he puesto uno de ejemplo.',
    en: 'Effects that last several rounds are listed here. The effects are independent from the cards they were created from. Look, I gave you one as an example.',
  },
  BUTTON_CHAT_TITLE: { es: 'Chat', en: 'Chat' },
  BUTTON_CHAT_TEXT: {
    es: 'Habla con tu rival o mándale reacciones. También se abre con la tecla Tab.',
    en: 'Talk to your rival or send them reactions. The Tab key opens it too.',
  },
  BUTTON_SETTINGS_TITLE: { es: 'Ajustes', en: 'Settings' },
  BUTTON_SETTINGS_TEXT: {
    es: 'Volumen, idioma, velocidad de las animaciones, tamaño del texto y cursor.',
    en: 'Volume, language, animation speed, text size and cursor.',
  },
  BUTTON_HELP_TITLE: { es: 'Ayuda', en: 'Help' },
  BUTTON_HELP_TEXT: {
    es: 'Una guía rápida con los tipos de carta y un vídeo de cada acción, por si necesitas repasar en mitad de una partida.',
    en: 'A quick guide with the card types and a video of each action, in case you need a refresher mid-game.',
  },
  BUTTON_SURRENDER_TITLE: { es: 'Rendirse', en: 'Surrender' },
  BUTTON_SURRENDER_TEXT: {
    es: 'Abandona la partida dándola por perdida. Aquí, te saca del tutorial.',
    en: 'Concede the match. Here, it takes you out of the tutorial.',
  },
  DRAG_TITLE: { es: 'Moverse por la mesa', en: 'Moving around the table' },
  DRAG_TEXT: {
    es: 'Si la mesa no te cabe en la pantalla, haz clic y arrastra sobre ella para desplazarte.',
    en: "If the table doesn't fit on your screen, click and drag on it to move around.",
  },

  // ---------- Rounds ----------
  ROUNDS_TITLE: { es: 'Las rondas', en: 'Rounds' },
  ROUNDS_TEXT: {
    es: 'La partida avanza por rondas. En cada ronda, cada jugador juega un turno, siempre en el mismo orden.',
    en: 'The game is played in rounds. Every round, each player takes one turn, always in the same order.',
  },
  ROUND_COUNTER_TITLE: { es: 'Contador de rondas', en: 'Round counter' },
  ROUND_COUNTER_TEXT: {
    es: 'Aquí ves en qué ronda estáis.',
    en: 'This shows which round you are in.',
  },
  WHOSE_TURN_TITLE: { es: '¿De quién es el turno?', en: "Whose turn is it?" },
  WHOSE_TURN_TEXT: {
    es: 'Las luces que rodean la vida de un jugador se agitan durante su turno: rojas si es el rival, azules si eres tú. Ahora mismo le toca al rival.',
    en: "The lights around a player's health swirl during their turn: red for the rival, blue for you. Right now it's the rival's turn.",
  },
  RIVAL_PLAYED_UNIT_TITLE: { es: 'El rival ha movido', en: 'The rival made a move' },
  RIVAL_PLAYED_UNIT_TEXT: {
    es: 'Ha jugado un Molino de viento. Al hacerlo, su turno ha terminado.',
    en: 'They played a Windmill. Doing so ended their turn.',
  },
  MY_TURN_TITLE: { es: 'Te toca', en: 'Your move' },
  MY_TURN_TEXT: {
    es: 'Ahora las luces azules giran alrededor de tu vida. Además, al empezar tu turno siempre verás este aviso.',
    en: 'Now the blue lights swirl around your health. You will also always get the banner when your turn begins.',
  },
  ONE_ACTION_TITLE: { es: '¿Qué puedo hacer en mi turno?', en: 'What can I do on my turn?' },
  ONE_ACTION_TEXT: {
    es: 'Una sola acción: jugar una carta, atacar con una unidad o robar una carta. En cuanto la haces, el turno pasa al rival. La excepción son las habilidades: usarlas no gasta tu acción.',
    en: 'A single action: play a card, attack with a unit or draw a card. As soon as you do, the turn passes to your rival. Abilities are the exception: using them does not spend your action.',
  },
  DRAW_INDICATOR_TITLE: { es: 'Robo de cartas', en: 'Card draw' },
  DRAW_INDICATOR_TEXT: {
    es: 'Cuando este icono aparece junto a la ronda, al terminarla todos los jugadores roban una carta. Ocurre cada 2 rondas, en las impares.',
    en: 'When this icon shows next to the round, every player draws a card when it ends. It happens every 2 rounds, on odd ones.',
  },

  // ---------- Playing ----------
  INSPECT_TITLE: { es: 'Inspeccionar cartas', en: 'Inspecting cards' },
  INSPECT_TEXT: {
    es: 'Antes de jugar conviene saber qué hace cada carta. Haz clic derecho sobre el Maestro de la ceniza de tu mano para inspeccionarlo.',
    en: 'Before playing, it pays to know what each card does. Right-click the Master of Ash in your hand to inspect it.',
  },
  CLOSE_INSPECT_TITLE: { es: 'La carta, al detalle', en: 'The card, in detail' },
  CLOSE_INSPECT_TEXT: {
    es: 'Ves su nombre, sus familias, su descripción y, si la tiene, su condición para jugarla: esta necesita que hayas jugado 5 bolas de fuego, por eso aparece oscurecida. Haz clic fuera de la carta o pulsa Esc para cerrarla.',
    en: "You can see its name, its families, its description and, if it has one, the condition to play it: this one needs you to have played 5 fireballs, which is why it's darkened. Click outside the card or press Esc to close it.",
  },
  PLAY_SPELL_TITLE: { es: 'Jugar un hechizo', en: 'Playing a spell' },
  PLAY_SPELL_TEXT: {
    es: 'Los hechizos se lanzan con un solo clic y su efecto ocurre al momento. Haz clic en la Bola de fuego: hará 4 de daño a la primera unidad de la izquierda del rival.',
    en: "Spells are cast with a single click and take effect right away. Click the Fireball: it deals 4 damage to the rival's leftmost unit.",
  },
  AFTER_SPELL_TITLE: { es: '¡Molino derribado!', en: 'Windmill down!' },
  AFTER_SPELL_TEXT: {
    es: 'La Bola de fuego ha acabado con el molino y ahora ocupa tu hueco de último hechizo. Jugarla ha gastado tu acción, así que tu turno ha terminado.',
    en: 'The Fireball destroyed the windmill and now sits in your last spell slot. Playing it spent your action, so your turn is over.',
  },
  ROUND_END_DRAW_TITLE: { es: 'Fin de ronda', en: 'End of round' },
  ROUND_END_DRAW_TEXT: {
    es: 'Como la ronda tenía el icono de robo, al terminar tanto tú como el rival habéis robado una carta.',
    en: 'Since the round had the draw icon, both you and your rival drew a card when it ended.',
  },
  NO_DRAW_ROUND_TITLE: { es: 'Ronda par', en: 'Even round' },
  NO_DRAW_ROUND_TEXT: {
    es: 'Ronda 2: el icono de robo ha desaparecido. Al final de esta ronda nadie roba; volverá en la siguiente.',
    en: "Round 2: the draw icon is gone. Nobody draws at the end of this round; it'll be back in the next one.",
  },
  SELECT_UNIT_TITLE: { es: 'Jugar una unidad', en: 'Playing a unit' },
  SELECT_UNIT_TEXT: {
    es: 'Las unidades se juegan en dos pasos. Primero, haz clic en la Cría de dragón de tu mano para seleccionarla.',
    en: 'Units are played in two steps. First, click the Dragon Hatchling in your hand to select it.',
  },
  PLACE_UNIT_TITLE: { es: 'Elige un hueco', en: 'Pick a slot' },
  PLACE_UNIT_TEXT: {
    es: 'Ahora haz clic en cualquier hueco libre de tu mesa para colocarla.',
    en: 'Now click any free slot on your board to place it.',
  },
  EFFECT_TRIGGERED_TITLE: { es: 'Un efecto se activa', en: 'An effect triggers' },
  EFFECT_TRIGGERED_TEXT: {
    es: 'Al terminar la ronda se ha activado tu Invierno interminable: el Rebaño de corderos ha perdido 1 de ataque. Era su último final de ronda, así que el efecto ha desaparecido del panel.',
    en: 'At the end of the round your Endless Winter triggered: the Flock of Lambs lost 1 attack. That was its last end of round, so the effect left the panel.',
  },
  SELECT_ATTACKER_TITLE: { es: 'Atacar a una unidad', en: 'Attacking a unit' },
  SELECT_ATTACKER_TEXT: {
    es: 'Tus unidades en mesa pueden atacar. Haz clic en tu Cría de dragón para elegirla como atacante.',
    en: 'Your units on the board can attack. Click your Dragon Hatchling to pick it as the attacker.',
  },
  ATTACK_UNIT_TITLE: { es: 'Elige el objetivo', en: 'Pick the target' },
  ATTACK_UNIT_TEXT: {
    es: 'Ahora haz clic en el Rebaño de corderos del rival. Al chocar, cada unidad le hace a la otra tanto daño como su ataque: el rebaño tiene 0 de ataque, así que tu cría saldrá ilesa.',
    en: "Now click the rival's Flock of Lambs. When they clash, each unit deals damage equal to its attack to the other: the flock has 0 attack, so your hatchling will be unharmed.",
  },
  RIVAL_ATTACKED_TITLE: { es: '¡Te han atacado!', en: "You've been attacked!" },
  RIVAL_ATTACKED_TEXT: {
    es: 'El molino del rival ha golpeado tu vida directamente. Las unidades pueden atacar al jugador rival aunque tenga unidades en su mesa.',
    en: "The rival's windmill hit your health directly. Units can attack the rival player even when they have units on their board.",
  },
  SELECT_ABILITY_TITLE: { es: 'Usar una habilidad', en: 'Using an ability' },
  SELECT_ABILITY_TEXT: {
    es: 'La Cría de dragón tiene una HABILIDAD: el número brillante sobre la carta indica cuántos usos le quedan. Haz clic en ella para seleccionarla…',
    en: 'The Dragon Hatchling has an ABILITY: the glowing number on the card shows how many uses it has left. Click it to select it…',
  },
  USE_ABILITY_TITLE: { es: 'Usar una habilidad', en: 'Using an ability' },
  USE_ABILITY_TEXT: {
    es: '…y vuelve a hacer clic sobre ella para activar su habilidad.',
    en: '…and click it again to activate its ability.',
  },
  AFTER_ABILITY_TITLE: { es: '¡Sigue siendo tu turno!', en: "It's still your turn!" },
  AFTER_ABILITY_TEXT: {
    es: 'Le has quitado 1 de vida al rival y te la has quedado. Las habilidades no gastan tu acción, así que aún puedes hacer algo más.',
    en: "You took 1 health from your rival and kept it. Abilities don't spend your action, so you can still do something else.",
  },
  SELECT_ATTACKER_PLAYER_TITLE: { es: 'Atacar al rival', en: 'Attacking the rival' },
  SELECT_ATTACKER_PLAYER_TEXT: {
    es: 'Aprovecha la acción: vuelve a seleccionar tu Cría de dragón…',
    en: 'Make use of your action: select your Dragon Hatchling again…',
  },
  ATTACK_PLAYER_TITLE: { es: 'Atacar al rival', en: 'Attacking the rival' },
  ATTACK_PLAYER_TEXT: {
    es: '…y haz clic en la vida del rival para golpearle directamente.',
    en: "…and click the rival's health to hit them directly.",
  },
  PLAY_SPELL_ABILITY_TITLE: { es: 'Hechizos con habilidad', en: 'Spells with abilities' },
  PLAY_SPELL_ABILITY_TEXT: {
    es: 'Algunos hechizos también tienen habilidad. Juega la Mordedura de rata: hará 3 de daño a la primera unidad de la izquierda del rival.',
    en: "Some spells have an ability too. Play the Rat Bite: it deals 3 damage to the rival's leftmost unit.",
  },
  AFTER_SPELL_ABILITY_TITLE: { es: 'Una habilidad en reserva', en: 'An ability in reserve' },
  AFTER_SPELL_ABILITY_TEXT: {
    es: 'La Mordedura de rata ocupa ahora tu hueco de último hechizo, con su habilidad lista. Pero ya has gastado tu acción: tendrás que esperar a tu próximo turno para usarla.',
    en: "The Rat Bite now sits in your last spell slot, with its ability ready. But you've already spent your action: you'll have to wait for your next turn to use it.",
  },
  RIVAL_DREW_TITLE: { es: 'El rival roba', en: 'The rival draws' },
  RIVAL_DREW_TEXT: {
    es: 'El rival ha gastado su turno en robar una carta de su mazo. Tú también puedes hacerlo.',
    en: 'The rival spent their turn drawing a card from their deck. You can do that too.',
  },
  USE_SPELL_ABILITY_TITLE: { es: 'Habilidad del último hechizo', en: 'Last spell ability' },
  USE_SPELL_ABILITY_TEXT: {
    es: 'Haz clic en la Mordedura de rata de tu hueco de último hechizo para usar su habilidad: robar una carta.',
    en: 'Click the Rat Bite in your last spell slot to use its ability: draw a card.',
  },
  DRAW_TITLE: { es: 'Robar una carta', en: 'Drawing a card' },
  DRAW_TEXT: {
    es: 'Por último, también puedes gastar tu acción en robar: haz clic en tu mazo. Recuerda que con 10 cartas en la mano no robarás nada.',
    en: "Finally, you can also spend your action drawing: click your deck. Remember that with 10 cards in hand you won't draw anything.",
  },
  MULTIPLAYER_TITLE: { es: 'Partidas de 3 o más', en: 'Games of 3 or more' },
  MULTIPLAYER_TEXT: {
    es: 'Con más de dos jugadores, cada ronda uno de ellos es el objetivo de todos los demás, y él apunta a todos sus rivales. Junto al mazo de cada jugador verás a quién apunta.',
    en: 'With more than two players, each round one of them is everyone else\'s target, and that player targets all of their rivals. Next to each player\'s deck you\'ll see who they are targeting.',
  },
  FINISH_TITLE: { es: '¡Tutorial completado!', en: 'Tutorial complete!' },
  FINISH_TEXT: {
    es: 'Ya sabes todo lo necesario para sentarte a la mesa. ¡Buena suerte, mago!',
    en: 'You know everything you need to take a seat at the table. Good luck, wizard!',
  },
  FINISH_HOME: { es: 'Volver al inicio', en: 'Back to home' },
  FINISH_REPLAY: { es: 'Repetir tutorial', en: 'Replay tutorial' },
} satisfies Record<string, LocalizedText>;

export type TutorialTextKey = keyof typeof TUTORIAL_TEXT;
