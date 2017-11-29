import * as numeral from 'numeral';

export class IntegerValueConverter {
  fromView(value: string): number {
    let numeric: number = parseInt(value);

    if (isNaN(numeric)) {
      numeric = 0;
    }

    return numeric;
  }

  toView(value:number):string {
    let text = '';

    if(typeof value === 'number') {
      text = value.toString();
    }

    return text;
  }
}
