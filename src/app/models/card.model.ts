export class Card {

  id: string = "";
  name: string = "";
  description: string = "";
  attack?: number = 0;
  health?: number = 0;
  imageUrl?: string = "";
  type?: string = "";
  families?: string[] = [];
  canPlay?: boolean = true;
  hasEffect?: boolean = false;
  effectTimes?: number = 0;

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
    if(this.health != null ) this.health += this.healthChangedAmount;

    setTimeout(() => {
    }, durationAnimation)
  }

  changeDamage(amount: number, durationAnimation: number)
  {
    this.attackChanged = true;
    this.attackChangedAmount = amount;
    if(this.attack != null) this.attack += this.attackChangedAmount;

    setTimeout(() => {
      this.attackChanged = false;
    }, durationAnimation)
  }
}