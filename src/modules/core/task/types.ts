export type EventLoop = {
  loop(): void;
};

export type Task = EventLoop & {
  addTask(...args: Array<any>): any;

  removeTask(key: string): any;

  hasTask(key: string): boolean;
};
