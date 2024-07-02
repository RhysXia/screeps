import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  CreepSpawnCode,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import { RoleName, Role } from "./types";
import harverster from "./roles/harverster";
import context from "./context";

export type DevelopModuleExport = {};

// @ts-ignore
const roles: Record<RoleName, Role> = {
  [RoleName.HARVERSTER]: harverster,
};

const baseDevelop = defineScreepModule<
  {
    [creepSpawnModuleName]: CreepSpawnModuleExport;
  },
  DevelopModuleExport
>({
  name: "baseDevelop",
  inject: [creepSpawnModuleName],
  binding({ [creepSpawnModuleName]: { spawn, onSpawn } }) {
    context.setCreepSpawn(spawn);
    context.setRoles(roles);
    onSpawn((name, result) => {
      context.onSpawn(name, result);
    });
  },
  initialize() {
    if (!Memory.creepConfig) {
      Memory.creepConfig = {};
    }
    context.checkAndCreateRoles();
  },
  process() {
    // 刷新context
    context.update();

    // 执行 role plan
    Object.keys(Memory.creepConfig).forEach((it) => {
      const creep = Game.creeps[it];
      const config = Memory.creepConfig[it];
      if (!config || config.spwaning) {
        return;
      }

      // creep 不存在， 同时没有孵化，大概率挂掉了
      if (!creep) {
        context.creepRespawn(it);
        return;
      }

      if (creep.spawning) {
        return;
      }

      const role = roles[config.role];

      if (config.cursor === undefined) {
        config.cursor = role.prepare?.(creep, config) ?? true ? 0 : undefined;
      }

      const cursor = config.cursor;

      if (cursor === undefined) {
        return;
      }

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

export default baseDevelop;
