import { defineScreepModule } from "core/module";
import { CreepModuleExport } from "modules/creep";
import { CreepTaskResultCode } from "modules/creep/CreepTask";
import { Role } from "./types";
import { EnhancedCreep } from "./EnhancedCreep";

export type DevelopModuleExport = {};

const develop = defineScreepModule<
  {
    creep: CreepModuleExport;
  },
  DevelopModuleExport
>({
  name: "develop",
  inject: ["creep"],
  initialize() {
    Object.getOwnPropertyNames(EnhancedCreep.prototype).forEach((it) => {
      Creep.prototype[it] = EnhancedCreep.prototype[it];
    });
  },
  preProcess({ creep: { creepTask } }) {
    if (!Memory.creepConfig) {
      Memory.creepConfig = {};
    }
    creepTask.registerListener((name, result) => {
      if (result === CreepTaskResultCode.OK) {
        const config = Memory.creepConfig[name];
        if (!config) {
          return;
        }
        Game.creeps[name].memory.role = config.role;
      }
    });
  },
  process() {
    Object.keys(Memory.creepConfig).forEach((it) => {
      const creep = Game.creeps[it];
      if (creep) {
        (creep as EnhancedCreep).work();
      }
    });
  },
  postProcess(ctx) {
    const time = Game.time;

    if (time % 5 === 0) {
      _.forEach(Game.spawns, (spawn) => {
        const room = spawn.room;
        const sources = room.find(FIND_SOURCES_ACTIVE);

        const harversters = Object.values(Memory.creepConfig).filter(
          (it) => it.role === Role.HARVERSTER && it.room === room.name
        ).length;
        if (harversters < sources.length) {
          const name = `${room.name}_harverster_${Game.time}`;
          ctx.creep.creepTask.addTask(name, room.name, [WORK, CARRY, MOVE]);
          Memory.creepConfig[name] = {
            role: Role.HARVERSTER,
            room: room.name,
          };
        }
      });
    }
  },
});

export default develop;
