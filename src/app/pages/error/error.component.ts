import { Component } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-error.component',
  standalone: false,
  templateUrl: './error.component.html',
  styleUrl: './error.component.css',
})
export class ErrorComponent {

  constructor(private r: Router) {}

  tryReload()
  {
    this.r.navigateByUrl("/")
  }
}
