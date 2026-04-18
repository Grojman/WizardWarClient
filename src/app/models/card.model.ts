export class Card {

  id: string = "";
  name: string = "";
  attack?: number = 0;
  health?: number = 0;
  imageUrl?: string = "";
  type?: string = "";

  attackChanged?: boolean = false;
  healthChanged?: boolean = false;

  attackChangedAmount?: number = 0;
  healthChangedAmount?: number = 0;

  constructor(data?: Partial<Card>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromJSON(data: any): Card {
    return new Card(data);
  }

  changeHealth(amount: number, durationAnimation: number)
  {
    this.healthChanged = true;
    this.healthChangedAmount = amount;

    setTimeout(() => {
      if (!this.health || !this.healthChangedAmount) return;

      this.health += this.healthChangedAmount;

      this.healthChanged = false;
    }, durationAnimation)
  }

  changeDamage(amount: number, durationAnimation: number)
  {
    this.attackChanged = true;
    this.attackChangedAmount = amount;

    setTimeout(() => {
      if (!this.attack || !this.attackChangedAmount) return;

      this.attack += this.attackChangedAmount;

      this.attackChanged = false;
    }, durationAnimation)
  }
}