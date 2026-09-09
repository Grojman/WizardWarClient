// Mirrors WizardWarServer's ChromaticColor enum
// (GameManagement/Board/Events/ChromaticColor.cs). This is what
// GlobalEffectDto.Color / Player.GlobalEffects[].Color carry over the wire.
export type ChromaticColorName = 'Rojo' | 'Verde' | 'Azul' | 'Amarillo' | 'Celeste' | 'Morado' | 'Blanco';

// The CSS class each color is already tagged with in card description text
// (see WizardWarServer's Data/Translations/cards.csv, e.g. "{red:Rojo}") and
// in cardvisualizer.component.css.
export const CHROMATIC_COLOR_CLASS: Record<ChromaticColorName, string> = {
  Rojo: 'red',
  Verde: 'green',
  Azul: 'blue',
  Amarillo: 'yellow',
  Celeste: 'cyan',
  Morado: 'purple',
  Blanco: 'white',
};

export const CHROMATIC_COLOR_HEX: Record<ChromaticColorName, string> = {
  Rojo: '#e53935',
  Verde: '#43a047',
  Azul: '#1e88e5',
  Amarillo: '#f9a825',
  Celeste: '#00acc1',
  Morado: '#8e24aa',
  Blanco: '#f5f5f5',
};

export const CHROMATIC_CLASSES: ReadonlySet<string> = new Set(Object.values(CHROMATIC_COLOR_CLASS));
