import { CreepSpawnFn } from "modules/creepSpawn";
import {
  CreepData,
  LifecycleBindContextThis,
  MemoryData,
  MessageRecord,
  Role,
  RoleName,
} from "../types";

// @ts-ignore
const bodiesMap: Record<RoleName, Array<BodyPartConstant>> = {
  [RoleName.HARVERSTER]: [WORK, CARRY, MOVE],
};

const spawn: MessageRecord = {
  onSpawn({ name, code }) {
    if (code === ERR_NAME_EXISTS) {
      return;
    }
    if (code !== OK) {
      delete this.memory.creeps[name];
      return;
    }
    this.memory.creeps[name].spwaning = false;
  },
  spawn({ room, role, config }) {
    console.log('spawn', '------')
    const memory = this.memory.creeps;

    const bodies = bodiesMap[role];
    const name = `${role}_${String(Game.time).slice(-5, -1)}${
      Object.keys(memory).length
    }`;

    memory[name] = {
      role,
      room,
      cursor: 0,
      spwaning: true,
      ...config,
    };

    this.modules.creepSpawn.spawn(room, name, bodies);
  },
  reSpawn(name) {
    const config = this.memory.creeps[name];
    if (!config) {
      throw new Error(`could not found creep(${name})`);
    }

    this.modules.creepSpawn.spawn(config.room, name, bodiesMap[config.role]);

    config.spwaning = true;
  },
};

export default spawn;
