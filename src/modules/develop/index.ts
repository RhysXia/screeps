import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import {
  moduleName as defenderModuleName,
  DefenderModuleExport,
} from "modules/defender";
import {
  moduleName as messageModuleName,
  MessageModuleExport,
} from "modules/message";
import { RoleName, Role, MemoryData, Publisher, MessageRecord } from "./types";
import harverster from "./roles/harverster";
import spawn from "./system/spawn";

export type DevelopModuleExport = {};

// @ts-ignore
const roles: Record<RoleName, Role<any>> = {
  [RoleName.HARVERSTER]: harverster,
};

const systems: Array<MessageRecord> = [spawn];

export const moduleName = "develop";

export default defineScreepModule<
  {
    [creepSpawnModuleName]: CreepSpawnModuleExport;
    [defenderModuleName]: DefenderModuleExport;
    [messageModuleName]: MessageModuleExport;
  },
  DevelopModuleExport,
  MemoryData
>({
  name: moduleName,
  inject: [creepSpawnModuleName, defenderModuleName, messageModuleName],
  binding() {
    const { onSpawn } = this.modules[creepSpawnModuleName];
    const { subsribe, publish } = this.modules[messageModuleName];

    onSpawn((name, code) => {
      (publish as Publisher)("onSpawn", {
        name,
        code,
      });
    });

    Object.values(roles).forEach((role) => {
      const messages = role.messages;
      Object.keys(messages).forEach((msg) => {
        const fn = messages[msg];
        subsribe(msg, (params) => fn.call({ ...this, publish }, params));
      });
    });

    systems.forEach((sys) => {
      Object.keys(sys).forEach((msg) => {
        const fn = sys[msg];
        subsribe(msg, (params) => fn.call({ ...this, publish }, params));
      });
    });
  },
  initialize() {

    this.memory.creeps = {}

    const { publish } = this.modules[messageModuleName];

    // 初始化
    (publish as Publisher)("moduleInit");
  },
  process() {
    const memory = this.memory;

    const creepsMemory = memory.creeps;

    const { defense } = this.modules[defenderModuleName];
    const { publish } = this.modules[messageModuleName];

    // 执行 role plan
    Object.keys(creepsMemory).forEach((it) => {
      const creep = Game.creeps[it];
      const config = creepsMemory[it];
      if (!config || config.spwaning) {
        return;
      }

      // creep 不存在， 同时没有孵化，大概率挂掉了，触发防御
      if (!creep) {
        (publish as Publisher)("reSpawn", it);
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

      const ret = (plan as Function).call({ ...this, publish }, creep, config);

      if (typeof ret === "number") {
        const newCursor =
          (ret + cursor + role.plans.length) % role.plans.length;
        config.cursor = newCursor;
      }
    });
  },
});
