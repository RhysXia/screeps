import { CreepSpawnFn } from "modules/creepSpawn";
import { CreepConfigItem, RoleName } from "./types";

// @ts-ignore
const bodiesMap: Record<RoleName, Array<BodyPartConstant>> = {
  [RoleName.HARVERSTER]: [WORK, CARRY, MOVE],
};

class Context {
  private _creepSpawn: CreepSpawnFn;
  private i: number;

  refresh() {
    this.i = 0;
  }

  setCreepSpawn(creepSpawn: CreepSpawnFn) {
    this._creepSpawn = creepSpawn;
  }

  onSpawn(name: string, code: ScreepsReturnCode) {
    if (code === ERR_NAME_EXISTS) {
      return;
    }
    if (code !== OK) {
      delete Memory.creepConfig[name];
      return;
    }
    Memory.creepConfig[name].spwaning = false;
  }

  creepRespawn(name: string) {
    const config = Memory.creepConfig[name];
    if (!config) {
      throw new Error(`could not found creep(${name})`);
    }
    this._creepSpawn(name, config.room, bodiesMap[config.role]);

    config.spwaning = true;
  }

  creepSpawn<T extends Record<string, any> = Record<string, any>>(
    role: RoleName,
    room: string
  ) {
    const name = `${room}_${role}_${Game.time}${this.i++}`;

    this._creepSpawn(name, room, bodiesMap[role]);

    const config = {
      role,
      room,
      spwaning: true,
    } as CreepConfigItem<T>;

    Memory.creepConfig[name] = config;

    return config;
  }
}

export default new Context();
