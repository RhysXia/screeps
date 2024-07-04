export class Message<T extends Record<string, any>> {
  private subscribeMap: Map<string, Set<(params?: any) => void>>;

  constructor() {
    this.subscribeMap = new Map();
    this.subscribe = this.subscribe.bind(this);
    this.publish = this.publish.bind(this);
  }

  subscribe<M extends keyof T>(
    message: M,
    fn: (...args: T[M] extends void ? [] : [T[M]]) => void
  ) {
    const set = this.subscribeMap.get(message as string) || new Set();

    set.add(fn);

    this.subscribeMap.set(message as string, set);
  }

  publish<M extends keyof T>(
    message: M,
    ...args: T[M] extends void ? [] : [T[M]]
  ) {
    const set = this.subscribeMap.get(message as string);

    if (!set) {
      return;
    }
    set.forEach((fn) => {
      fn(args[0]);
    });
  }
}
