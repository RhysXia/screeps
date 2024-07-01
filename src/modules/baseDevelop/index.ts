import { defineScreepModule } from "core/module";
import { CreepModuleExport, CreepTaskCode } from "modules/creepTask";
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
    creepTask: CreepModuleExport;
  },
  DevelopModuleExport
>({
  name: "baseDevelop",
  inject: ["creepTask"],
  binding({ creepTask: { listenTask, addTask } }) {
    listenTask((name, result) => {
      if (result === ERR_NAME_EXISTS) {
        return;
      }
      if (result !== CreepTaskCode.OK) {
        delete Memory.creepConfig[name];
        return;
      }
      Memory.creepConfig[name].spwaning = false;
    });
    context.setAddTask(addTask);
  },
  initialize() {
    if (!Memory.creepConfig) {
      Memory.creepConfig = {};
    }
    Object.values(roles).forEach((it) => it.create());
  },
  process() {
    Object.keys(Memory.creepConfig).forEach((it) => {
      const creep = Game.creeps[it];
      // creep 不存在， 同时没有孵化，大概率挂掉了
      if (Memory.creepConfig[it].spwaning) {
        return;
      }

      if (!creep) {
        delete Memory.creepConfig[it];
        return;
      }

      if (creep.spawning) {
        return;
      }

      const config = Memory.creepConfig[it];

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
