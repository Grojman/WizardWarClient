export class Health {

  health: number = 0;

  displayHealth: number = 0;

  animationState: 'idle' | 'exit' | 'enter' = 'idle';

  negative: boolean = false;

  changeHealth(amount: number, duration: number) {

    this.negative = amount < 0;

    // Primero animar salida
    this.animationState = 'exit';

    setTimeout(() => {

      // Cambiar valor real
      this.health += amount;

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