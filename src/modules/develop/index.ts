import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import {
  moduleName as defenderModuleName,
  DefenderModuleExport,
} from "modules/defender";
import { RoleName, Role, MemoryData, MessageDefine } from "./types";
import harverster from "./roles/harverster";
import creep from "./system/creep";
import message, { MessageType } from "./message";

export type DevelopModuleExport = {};

// @ts-ignore
const roles: Record<RoleName, Role<any>> = {
  harverster: harverster,
};

const systems: Array<MessageDefine> = [creep];

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
    const { onSpawn } = this.modules[creepSpawnModuleName];

    onSpawn((name, code) => {
      message.publish("onSpawn", {
        name,
        code,
      });
    });

    const messageDefines = [
      ...systems,
      Object.values(roles).map((it) => it.messages),
    ];

    messageDefines.forEach((sys) => {
      Object.keys(sys).forEach((msg) => {
        const fn = sys[msg];
        message.subscribe(msg as keyof MessageType, (params) =>
          fn.call({ ...this, publish: message.publish }, params)
        );
      });
    });
  },
  initialize() {
    // 数据初始化
    this.memory.creeps = {};

    // 初始化
    message.publish("moduleInit");
  },
  process() {
    const memory = this.memory;

    const creepsMemory = memory.creeps;

    const { defense } = this.modules[defenderModuleName];

    // 执行 role plan
    Object.keys(creepsMemory).forEach((it) => {
      const creep = Game.creeps[it];
      const config = creepsMemory[it];
      if (!config || config.spawning) {
        return;
      }

      // creep 不存在， 同时没有孵化，大概率挂掉了，触发防御
      if (!creep) {
        message.publish("reSpawn", it);
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

      const ret = (plan as Function).call(
        { ...this, publish: message.publish },
        creep,
        config
      );

      if (typeof ret === "number") {
        const newCursor =
          (ret + cursor + role.plans.length) % role.plans.length;
        config.cursor = newCursor;
      }
    });
  },
});
