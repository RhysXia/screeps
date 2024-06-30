import { defineScreepModule } from "core/module";
import { ALL_BODIES } from "./types";

export type CreepTaskListener = (
  name: string,
  code: CreepTaskCode | ScreepsReturnCode
) => void;

export type CreepTaskAddTask = (
  name: string,
  room: string,
  bodies: Array<BodyPartConstant>
) => void;

export type CreepModuleExport = {
  binding: {
    listenTask(fn: CreepTaskListener): void;
    addTask: CreepTaskAddTask;
  };
};

export enum CreepTaskCode {
  OK,
  ERR_SPAWN_NOT_FOUND,
}

const listeners: Array<CreepTaskListener> = [];

const callListeners: CreepTaskListener = (name, code) => {
  listeners.forEach((it) => it(name, code));
};

export default defineScreepModule<{}, CreepModuleExport>({
  name: "creepTask",
  binding() {
    return {
      listenTask(fn) {
        listeners.push(fn);
      },
      addTask(name, room, bodies) {
        if (!Memory.creepTasks) {
          Memory.creepTasks = [];
        }
        const creepTasks = Memory.creepTasks;
        creepTasks.push({
          n: name,
          r: room,
          b: bodies.map((it) => ALL_BODIES.indexOf(it)),
        });
      },
    };
  },
  postProcess() {
    const tasks = Memory.creepTasks;

    const newTasks: Memory["creepTasks"] = [];

    tasks.forEach((task) => {
      const { n, r, b } = task;

      const spawns = _.filter(Game.spawns, (it) => it.room.name === r);

      if (!spawns.length) {
        return callListeners(n, CreepTaskCode.ERR_SPAWN_NOT_FOUND);
      }

      let i = 0;
      for (; i < spawns.length; i++) {
        const spawn = spawns[i];
        if (spawn.spawning) {
          continue;
        }

        const code = spawn.spawnCreep(
          b.map((it) => ALL_BODIES[it]),
          n
        );

        if (code === OK) {
          return callListeners(n, CreepTaskCode.OK);
        }

        if (code === ERR_NOT_ENOUGH_ENERGY) {
          continue;
        }

        return callListeners(n, code);
      }

      if (i >= spawns.length) {
        newTasks.push(task);
      }
    });

    Memory.creepTasks = newTasks;
  },
});
