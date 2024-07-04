import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepSpawnModuleName,
} from "modules/creepSpawn";
import {
  SpawnModuleExport,
  moduleName as spawnModuleName,
} from "modules/spawn";
import {
  moduleName as defenderModuleName,
  DefenderModuleExport,
} from "modules/defender";
import { MemoryData, Subscribes } from "./types";
import creep from "./system/creep";
import message, { MessageType } from "./message";
import { debug, error } from "core/logger";
import roles from "./roles";

export type DevelopModuleExport = {};

const INIT_PLAN = "prepare";

const systems: Array<Subscribes> = [creep];

export const moduleName = "develop";

export default defineScreepModule<
  {
    [creepSpawnModuleName]: CreepSpawnModuleExport;
    [defenderModuleName]: DefenderModuleExport;
    [spawnModuleName]: SpawnModuleExport;
  },
  DevelopModuleExport,
  MemoryData
>({
  name: moduleName,
  inject: [creepSpawnModuleName, defenderModuleName, spawnModuleName],
  binding() {
    const { onSpawn } = this.modules[creepSpawnModuleName];

    onSpawn((name, code) => {
      message.publish('onCreepSpawn', {
        name,
        code,
      });
    });

    const subscribes = [
      ...systems,
      ...Object.values(roles).map((it) => it.subscribes),
    ];

    subscribes.forEach((sys) => {
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
    message.publish("check");
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
        message.publish('creepReSpawn', it);
        defense(config.room);
        return;
      }

      if (creep.spawning) {
        return;
      }

      const role = roles[config.role];

      const cursor = config.cursor || INIT_PLAN;

      let plan = role.plans[cursor];

      if (!plan) {
        error(`no plan(cursor: ${cursor}) found in role(${config.role})`);
        config.cursor = INIT_PLAN;
        plan = role.plans[INIT_PLAN];
      }

      const ret = (plan as Function).call(
        { ...this, publish: message.publish },
        creep,
        config
      );

      if (typeof ret === "string") {
        if (!role.plans[ret]) {
          error(`no plan(cursor: ${cursor}) found in role(${config.role})`);
          return;
        }
        config.cursor = ret;
      }
    });
  },
  postProcess() {
    debug("doing check");
    message.publish("check");
  },
});
