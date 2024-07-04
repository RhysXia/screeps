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
import { RoleName, Role, MemoryData, Subscribes } from "./types";
import harverster from "./roles/harverster";
import creep from "./system/creep";
import message, { MessageType } from "./message";
import { debug, error } from "core/logger";
import collector from "./roles/collector";

export type DevelopModuleExport = {};

const INIT_PLAN = "prepare";

// @ts-ignore
const roles: Record<RoleName, Role<any, any>> = {
  harverster,
  collector,
};

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
      message.publish("onSpawn", {
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
    // 每隔10tick 检查一次数据
    if (Game.time % 10) {
      message.publish("check");
      debug("doing check");
    }
  },
});
