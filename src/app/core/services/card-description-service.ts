import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CardDescriptionService
{
    parseDescription(description: string) : string
    {
      if (!description) return description;
      return description.replace(/\{([^:}]+):([^}]+)\}/g, (_m, cls, content) => `<span class="${cls}">${content}</span>`);
    }
}