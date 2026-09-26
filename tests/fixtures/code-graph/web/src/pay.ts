export function charge(n: number): number {
  return n;
}

export class Cart {
  total(): number {
    return this.sum();
  }
  sum(): number {
    return charge(2);
  }
}
