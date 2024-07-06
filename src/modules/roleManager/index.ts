import { error, warning } from "core/logger";
import { defineScreepModule, LifecycleName } from "core/module_back";
import {
  CreepSpawnFn,
  CreepSpawnModuleExport,
  moduleName as creepModuleName,
} from "modules/creepSpawn";

const DEFAULT_PLAN = "prepare";

export type DefaultPlanName = typeof DEFAULT_PLAN;

export type RoleConfig = {
  spawning?: true;
  spawnTime: number;
  waitTime?: number;
  room: string;
  action?: string;
  moduleName: string;
};

export type RoleManagerModuleExport = {
  binding: {
    onCheckAndCreate: <T extends RoleConfig>(
      fn: (creepConfigs: Record<string, T>) => void
    ) => void;
    /**
     *
     * @param fn  return true 表示保留config不删除
     */
    onRoleDead(fn: (creep: Creep, memory: any) => boolean);
    spawn: CreepSpawnFn;
    definePlans: <
      M extends { process?: (this: any) => any },
      Mem extends Record<string, any>,
      PlanName extends string,
      Context = M["process"] extends (this: infer T) => any ? T : never
    >(
      plans: Record<
        PlanName | DefaultPlanName,
        (this: Context, creep: Creep, memory: Mem) => PlanName | DefaultPlanName
      >
    ) => void;
  };
  process: {
    bindThis(ctx: any): void;
  };
};

export const moduleName = "roleManager";

const checkAndCreateFns = new Set<(creepConfigs: any) => void>();

const plansMap = new Map<
  string,
  Record<string, (this: any, creep: Creep, memory: any) => string>
>();

const onCreepDeadMap = new Map<
  string,
  (creep: Creep, memory: any) => boolean
>();

const contextMap = new Map<string, any>();

export default defineScreepModule<
  {
    [creepModuleName]: CreepSpawnModuleExport;
  },
  RoleManagerModuleExport,
  Record<string, RoleConfig & Record<string, any>>
>({
  name: moduleName,
  inject: [creepModuleName],
  binding() {
    const { onSpawn, spawn: creepSpawn } = this.modules[creepModuleName];
    onSpawn((name, code) => {
      const creeps = this.memory;

      if (!creeps[name]) {
        return;
      }
      if (code === ERR_NAME_EXISTS) {
        return;
      }
      if (code !== OK) {
        delete creeps[name];
        return;
      }
      delete creeps[name].spawning;
      creeps[name].spawnTime = Game.time;
    });
    return {
      onCheckAndCreate(fn) {
        checkAndCreateFns.add(fn);
      },
      onRoleDead(fn) {
        onCreepDeadMap.set(this.targetModuleName, fn);
      },
      spawn(...args) {
        return creepSpawn(...args);
      },
      definePlans(plans) {
        plansMap.set(this.targetModuleName, plans);
      },
    };
  },
  initialize() {
    const { spawn } = this.modules[creepModuleName];

    checkAndCreateFns.forEach((it) => it(spawn));
  },
  process() {
    return {
      bindThis(ctx) {
        contextMap.set(this.targetModuleName, ctx);
      },
    };
  },
  postProcess() {
    const memory = this.memory;

    Object.keys(memory).forEach((name) => {
      const config = memory[name];

      // 正在孵化，跳过
      if (config.spawning) {
        return;
      }

      const creep = Game.creeps[name];

      // creep 不存在，异常状况
      if (!creep) {
        return;
      }

      const plans = plansMap.get(config.moduleName);

      const action = config.action || "prepare";

      const plan = plans[action];

      if (!plan) {
        error(`no plan, module: ${config.moduleName}, action: ${action}`);
        return;
      }

      const ctx = contextMap.get(config.moduleName);

      if (!ctx) {
        warning(
          `you should call 'bindThis' to pass context, module: ${config.moduleName}`
        );
      }

      let nextAction = plan.call(ctx, creep, config);

      if (nextAction) {
        if (plans[nextAction]) {
          config.action = nextAction;
          creep.say(nextAction);
        } else {
          error(`no plan, module: ${config.moduleName}, action: ${action}`);
        }
      }

      if (config.waitTime && creep.ticksToLive < config.waitTime) {
      }

      // 快挂了，扔掉资源，并删除配置
      if (creep.ticksToLive < 2) {
        const onCreepDead = onCreepDeadMap.get(config.moduleName);

        if (onCreepDead) {
          // 表示不删除config
          if (onCreepDead(creep, config)) {
            return;
          }
        }
        delete memory[name];
      }
    });

    // 清理context
    contextMap.clear();
  },
});
