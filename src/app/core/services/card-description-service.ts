import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CardDescriptionService
{
    parseDescription(description: string) : string
    {
      if (!description) return description;
      return this.parseSegment(description, 0, false).html;
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

        html += ch;
        i++;
      }

      return { html, nextIndex: i };
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
        html: `<span class="${cls}">${inner.html}</span>`,
        nextIndex: inner.nextIndex + 1,
      };
    }
}