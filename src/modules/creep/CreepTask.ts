export enum CreepTaskAddCode {
  OK,
}

export enum CreepTaskRemoveCode {
  OK,
  ERR_NOT_EXIST,
}

export enum CreepTaskResultCode {
  OK,
  ERR_EXIST,
}

export class CreepTask {
  private listeners: Set<(name: string, result: CreepTaskResultCode) => void>;

  constructor() {
    this.listeners = new Set();
    if (!Memory.creepTasks) {
      Memory.creepTasks = [];
    }
  }

  private get tasks() {
    return Memory.creepTasks;
  }

  addTask(name: string, roomName: string, bodies: Array<BodyPartConstant>) {
    if (this.tasks.some((it) => it.name === name)) {
      return CreepTaskAddCode.OK;
    }

    this.tasks.push({
      name,
      room: roomName,
      bodies,
    });

    return CreepTaskAddCode.OK;
  }

  hasTask(name: string) {
    return this.tasks.some((it) => it.name === name);
  }

  removeTask(name: string) {
    const i = this.tasks.findIndex((it) => it.name === name);

    if (i < 0) {
      return CreepTaskRemoveCode.ERR_NOT_EXIST;
    }

    this.tasks.splice(i, 1);

    return CreepTaskRemoveCode.OK;
  }

  hungTask(name: string) {
    const i = this.tasks.findIndex((it) => it.name === name);
    if (i < 0) {
      return;
    }
    const task = this.tasks[i];
    this.tasks.splice(i, 1);
    this.tasks.push(task);
  }

  registerListener(fn: (name: string, result: CreepTaskResultCode) => void) {
    this.listeners.add(fn);
  }

  _trigger(name: string, result: CreepTaskResultCode) {
    this.listeners.forEach((it) => it(name, result));
  }
}
