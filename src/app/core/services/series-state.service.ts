import { Injectable } from '@angular/core';
import { SeriesEndResult, SeriesSnapshot } from '../../models/series.model';

@Injectable({
  providedIn: 'root',
})
export class SeriesStateService {
  snapshot: SeriesSnapshot | null = null;
  endResult: SeriesEndResult | null = null;

  applySeriesState(content: SeriesSnapshot): void {
    this.snapshot = content;
    this.endResult = null;
  }

  applySeriesEnd(content: SeriesEndResult): void {
    this.endResult = content;
  }

  clear(): void {
    this.snapshot = null;
    this.endResult = null;
  }
}
