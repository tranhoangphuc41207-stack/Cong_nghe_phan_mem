// Hàng đợi giới hạn dung lượng: khi đầy sẽ bỏ bản cũ nhất.
export class RingBuffer<T> {
  private items: T[] = [];
  dropped = 0;
  private readonly max: number;
  constructor(max: number) { this.max = max; }

  push(item: T): void {
    this.items.push(item);
    while (this.items.length > this.max) {
      this.items.shift();
      this.dropped++;
    }
  }
  peek(): T | undefined { return this.items[0]; }
  shift(): T | undefined { return this.items.shift(); }
  get length(): number { return this.items.length; }
}
