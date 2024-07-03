import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import {
  moduleName as defenderModuleName,
  DefenderModuleExport,
} from "modules/defender";
import { RoleName, Role, CreepData, MemoryData } from "./types";
import harverster from "./roles/harverster";
import context from "./context";

export type DevelopModuleExport = {};

// @ts-ignore
const roles: Record<RoleName, Role> = {
  [RoleName.HARVERSTER]: harverster,
};

export const moduleName = "develop";

export default defineScreepModule<
  {
    [creepSpawnModuleName]: CreepSpawnModuleExport;
    [defenderModuleName]: DefenderModuleExport;
  },
  DevelopModuleExport,
  MemoryData
>({
  name: moduleName,
  inject: [creepSpawnModuleName, defenderModuleName],
  binding() {
    const { spawn, onSpawn } = this.modules[creepSpawnModuleName];

    context.setCreepSpawn(spawn);
    context.setRoles(roles);
    context.setMemory(this.memory);

    onSpawn((name, result) => {
      context.onSpawn(name, result);
    });
  },
  initialize() {
    context.checkAndCreateRoles();
  },
  process() {
    // 刷新context
    context.refresh();

    const memory = this.memory;

    const creepsMemory = memory.creeps;

    const { defense } = this.modules[defenderModuleName];

    // 执行 role plan
    Object.keys(creepsMemory).forEach((it) => {
      const creep = Game.creeps[it];
      const config = creepsMemory[it];
      if (!config || config.spwaning) {
        return;
      }

      // creep 不存在， 同时没有孵化，大概率挂掉了
      if (!creep) {
        context.creepRespawn(it);
        defense(config.room);
        return;
      }

      if (creep.spawning) {
        return;
      }

      const role = roles[config.role];

      const cursor = config.cursor;

      const plan = role.plans[cursor];

      if (!plan) {
        console.error(
          `no plan(cursor: ${cursor}) found in role(${config.role})`
        );
        return;
      }

      const ret = plan(creep, config);

      if (typeof ret === "number") {
        const newCursor =
          (ret + cursor + role.plans.length) % role.plans.length;
        config.cursor = newCursor;
      }
    });
  },
});
