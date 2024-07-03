import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import {
  moduleName as defenderModuleName,
  DefenderModuleExport,
} from "modules/defender";
import { RoleName, Role, CreepConfigItem } from "./types";
import harverster from "./roles/harverster";
import context from "./context";

export type DevelopModuleExport = {};

// @ts-ignore
const roles: Record<RoleName, Role> = {
  [RoleName.HARVERSTER]: harverster,
};

export const moduleName = "baseDevelop";

export default defineScreepModule<
  {
    [creepSpawnModuleName]: CreepSpawnModuleExport;
    [defenderModuleName]: DefenderModuleExport;
  },
  DevelopModuleExport,
  Record<string, CreepConfigItem>
>({
  name: moduleName,
  inject: [creepSpawnModuleName, defenderModuleName],
  binding({ [creepSpawnModuleName]: { spawn, onSpawn } }) {
    context.setCreepSpawn(spawn);
    context.setRoles(roles);
    onSpawn((name, result) => {
      context.onSpawn(name, result);
    });
  },
  initialize() {
    // 刷新context
    context.refresh({
      memory: this.memory,
    });
    context.checkAndCreateRoles();
  },
  process({ [defenderModuleName]: { defense } }) {
    // 刷新context
    context.refresh({
      memory: this.memory,
    });
    const memory = this.memory;

    // 执行 role plan
    Object.keys(memory).forEach((it) => {
      const creep = Game.creeps[it];
      const config = memory[it];
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
