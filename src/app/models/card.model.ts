export class Card {

  id: string = "";
  serverId: string = "";
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

  conditionProgress?: number | null = null;
  conditionTarget?: number | null = null;

  constructor(data?: Partial<Card>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromJSON(data: any): Card {
    return new Card(data);
  }

  changeHealth(amount: number)
  {
    if (this.health != null) {
      this.health += amount;
    }
  }

  changeDamage(amount: number)
  {
    if (this.attack != null) {
      this.attack += amount;
    }
  }
}