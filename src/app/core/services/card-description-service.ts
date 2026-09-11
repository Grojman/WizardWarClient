import { Injectable } from '@angular/core';
import { CHROMATIC_CLASSES, CHROMATIC_COLOR_CLASS, CHROMATIC_COLOR_COMPONENTS, ChromaticColorName } from '../config/chromatic-colors';

@Injectable({
  providedIn: 'root',
})
export class CardDescriptionService
{
    // Set for the duration of a single parseDescription call (parsing is
    // synchronous and never re-entrant across calls) so tryParseToken can
    // tell which chromatic color classes are actually in effect right now,
    // given the card owner's currently active color — see
    // CardvisualizerComponent's `activeColor` input. Null when the caller
    // doesn't have that context (e.g. the gallery, outside of a live game),
    // in which case every color renders at full strength instead of being
    // dimmed.
    private activeClasses: ReadonlySet<string> | null = null;

    parseDescription(description: string, activeColor: ChromaticColorName | null = null) : string
    {
      if (!description) return description;
      this.activeClasses = activeColor === null ? null : this.resolveActiveClasses(activeColor);
      try
      {
        return this.parseSegment(description, 0, false).html;
      }
      finally
      {
        this.activeClasses = null;
      }
    }

    // A mixed color's effect applies as both of its base components at once
    // (e.g. Amarillo triggers whatever Rojo and Verde each do), and Blanco
    // triggers all three — see ChromaticColorHelper.Components server-side.
    // So every one of those classes should read as "currently in effect",
    // not just the exact active color's own word.
    private resolveActiveClasses(activeColor: ChromaticColorName): ReadonlySet<string>
    {
      const classes = CHROMATIC_COLOR_COMPONENTS[activeColor].map(c => CHROMATIC_COLOR_CLASS[c]);
      classes.push(CHROMATIC_COLOR_CLASS[activeColor]);
      return new Set(classes);
    }

    // Parses text starting at `start`, wrapping `{class:text}` tokens in
    // <span class="class">text</span>. Content between the colon and the
    // closing brace is parsed recursively, so a token nested inside another
    // token's text is resolved before the outer token closes. When
    // `stopAtClosingBrace` is true, parsing stops at (and excludes) the
    // first unmatched `}`, which is what lets the caller know where the
    // enclosing token ends.
    private parseSegment(
      text: string,
      start: number,
      stopAtClosingBrace: boolean
    ): { html: string; nextIndex: number }
    {
      let html = '';
      let i = start;

      let statsContainer = '';
      let isStatContainer = false;

      while (i < text.length)
      {
        const ch = text[i];

        if (ch === '{')
        {
          const token = this.tryParseToken(text, i);
          if (token)
          {
            html += token.html;
            i = token.nextIndex;
            continue;
          }
        }

        if (stopAtClosingBrace && ch === '}')
        {
          break;
        }

        
        if (ch === '[' && !isStatContainer) {
          isStatContainer = true;
        } else if (ch === ']' && isStatContainer) {
          isStatContainer = false;
          html += this.convertUnitValues(statsContainer);
          statsContainer = '';
        } else if (isStatContainer) {
          statsContainer += ch;
        } else {
          html += ch;
        }
        i++;

      }

      return { html, nextIndex: i };
    }

    private convertUnitValues(value: string) : string
    {
      const data = value.split('/');
      if (data.length !== 2) return value;
      const attack = data[0];
      const health = data[1];
      return `<span class="unit-attack"><span>${attack}</span></span> <span class="unit-health"><span>${health}</span></span>`;
    }

    // Attempts to parse a `{class:text}` token starting at `openIndex` (the
    // index of the opening `{`). Returns null if it isn't a well-formed
    // token, in which case the `{` is treated as ordinary text.
    private tryParseToken(
      text: string,
      openIndex: number
    ): { html: string; nextIndex: number } | null
    {
      const colonIndex = text.indexOf(':', openIndex + 1);
      if (colonIndex === -1) return null;

      const cls = text.slice(openIndex + 1, colonIndex);
      if (!cls || cls.includes('{') || cls.includes('}')) return null;

      const contentStart = colonIndex + 1;
      const inner = this.parseSegment(text, contentStart, true);

      if (text[inner.nextIndex] !== '}') return null;
      if (inner.nextIndex === contentStart) return null;

      return {
        html: `<span class="${this.resolveTokenClass(cls)}">${inner.html}</span>`,
        nextIndex: inner.nextIndex + 1,
      };
    }

    // For a chromatic color token (red/green/blue/...) adds a "chroma-active"
    // or "chroma-inactive" modifier so the CSS can fully light up every color
    // whose effect is currently in play (see resolveActiveClasses above) and
    // dim the rest (see cardvisualizer.component.css). Every other token
    // class is passed through as-is.
    private resolveTokenClass(cls: string): string
    {
      if (!CHROMATIC_CLASSES.has(cls) || this.activeClasses === null) return cls;

      return `${cls} ${this.activeClasses.has(cls) ? 'chroma-active' : 'chroma-inactive'}`;
    }
}