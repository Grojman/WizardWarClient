export class Health {

  health: number = 0;

  displayHealth: number = 0;

  animationState: 'idle' | 'exit' | 'enter' = 'idle';

  negative: boolean = false;

  positive: boolean = false;

  shaking: boolean = false;

  // Unit vector the shake plays along (knockback direction from the hit's origin).
  shakeX: number = 0;

  shakeY: number = 0;

  // originX/originY: attacker->target direction; defaults to a straight-down shake when unknown.
  changeHealth(amount: number, duration: number, originX: number = 0, originY: number = 1) {

    this.negative = amount < 0;
    this.positive = amount > 0;

    if (this.negative) {
      const length = Math.hypot(originX, originY) || 1;
      this.shakeX = originX / length;
      this.shakeY = originY / length;

      this.shaking = true;
      setTimeout(() => {
        this.shaking = false;
      }, duration);
    }

    // Primero animar salida
    this.animationState = 'exit';

    setTimeout(() => {

      // Cambiar valor real
      this.health += amount;

      this.negative = false;
      this.positive = false;

      // Actualizar lo que se muestra
      this.displayHealth = this.health;

      // Animar entrada
      this.animationState = 'enter';

      setTimeout(() => {

        this.animationState = 'idle';

      }, duration);

    }, duration);
  }

}