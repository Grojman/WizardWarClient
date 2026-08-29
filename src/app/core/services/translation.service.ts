import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private dictionary: Record<string, string> = {};
  private updatedSubject = new Subject<void>();
  updated$ = this.updatedSubject.asObservable();

  setDictionary(values: Record<string, string>): void {
    this.dictionary = values ?? {};
    this.updatedSubject.next();
  }

  translate(key: string): string {
    return this.dictionary[key] ?? key;
  }
}
