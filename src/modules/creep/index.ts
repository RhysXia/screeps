import { defineScreepModule } from "core/module";
import { CreepTask, CreepTaskResultCode } from "./CreepTask";

export type CreepModuleExport = {
  preProcess: {
    creepTask: CreepTask;
  };
};

let creepTask: CreepTask;

const creep = defineScreepModule<{}, CreepModuleExport>({
  name: "creep",
  initialize() {
    creepTask = new CreepTask();
  },
  preProcess() {
    return {
      creepTask,
    };
  },
  postProcess() {
    const tasks = Memory.creepTasks;

    tasks.forEach((task, i) => {
      const { name, room, bodies } = task;

      const spawns = _.filter(Game.spawns, (it) => it.room.name === room);

      if (!spawns.length) {
        tasks.splice(i, 1);
        return creepTask._trigger(name, CreepTaskResultCode.ERR_EXIST);
      }

      let isSpawning = false;

      for (const spawn of spawns) {
        if (spawn.spawning) {
          continue;
        }

        const code = spawn.spawnCreep(bodies, name);

        if (code === OK) {
          isSpawning = true;
          creepTask._trigger(name, CreepTaskResultCode.OK);
          break;
        }
      }

      if (!isSpawning) {
        tasks.splice(i, 1);
      }
    });
  },
});

export default creep;
