import { Injectable } from '@angular/core';
import { CHROMATIC_CLASSES, CHROMATIC_COLOR_CLASS, ChromaticColorName } from '../config/chromatic-colors';

@Injectable({
  providedIn: 'root',
})
export class CardDescriptionService
{
    // Set for the duration of a single parseDescription call (parsing is
    // synchronous and never re-entrant across calls) so tryParseToken can
    // tell which chromatic color word, if any, matches the card owner's
    // currently active color — see CardvisualizerComponent's `activeColor`
    // input. Null when the caller doesn't have that context (e.g. the
    // gallery, outside of a live game), in which case every color renders
    // at full strength instead of being grayed out.
    private activeColor: ChromaticColorName | null = null;

    parseDescription(description: string, activeColor: ChromaticColorName | null = null) : string
    {
      if (!description) return description;
      this.activeColor = activeColor;
      try
      {
        return this.parseSegment(description, 0, false).html;
      }
      finally
      {
        this.activeColor = null;
      }
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
    // or "chroma-inactive" modifier so the CSS can highlight whichever color
    // is actually active right now (see cardvisualizer.component.css) and
    // gray out the rest. Every other token class is passed through as-is.
    private resolveTokenClass(cls: string): string
    {
      if (!CHROMATIC_CLASSES.has(cls) || this.activeColor === null) return cls;

      const activeClass = CHROMATIC_COLOR_CLASS[this.activeColor];
      return `${cls} ${cls === activeClass ? 'chroma-active' : 'chroma-inactive'}`;
    }
}