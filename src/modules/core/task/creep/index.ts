import { Task } from "../../types";

declare global {
  interface Memory {
    creepTasks: Array<{
      name: string;
      room: string;
      bodies: Array<BodyPartConstant>;
    }>;
  }
}

export enum CreepTaskAddCode {
  OK,
}

export enum CreepTaskRemoveCode {
  OK,
  ERR_NOT_EXIST,
}

export enum CreepTaskResultCode {
  OK,
}

export class CreepTask implements Task {
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

  registerListener(fn: (name: string, result: CreepTaskResultCode) => void) {
    this.listeners.add(fn);
  }

  loop() {
    const tasks = Memory.creepTasks || [];
    if (!tasks.length) {
      return;
    }

    const { name, room, bodies } = tasks.pop();

    const spawns = _.filter(Game.spawns, (it) => it.room.name === room);
  }
}
