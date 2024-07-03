import { CreepSpawnFn } from "modules/creepSpawn";
import { CreepData, MemoryData, Role, RoleName } from "./types";

// @ts-ignore
const bodiesMap: Record<RoleName, Array<BodyPartConstant>> = {
  [RoleName.HARVERSTER]: [WORK, CARRY, MOVE],
};

class Context {
  private _creepSpawn: CreepSpawnFn;
  private _roles: Record<RoleName, Role<any>>;
  private _memory: MemoryData;

  private count = 0;

  refresh() {
    this.count = 0;
  }

  setMemory(memory: MemoryData) {
    this._memory = memory;

    if (!memory.creeps) {
      memory.creeps = {};
    }
  }

  getMemory() {
    return this._memory;
  }

  setCreepSpawn(creepSpawn: CreepSpawnFn) {
    this._creepSpawn = creepSpawn;
  }

  setRoles(roles: Record<RoleName, Role<any>>) {
    this._roles = roles;
  }

  onSpawn(name: string, code: ScreepsReturnCode) {
    if (code === ERR_NAME_EXISTS) {
      return;
    }
    if (code !== OK) {
      delete this._memory.creeps[name];
      return;
    }
    this._memory.creeps[name].spwaning = false;
  }

  creepRespawn(name: string) {
    const config = this._memory.creeps[name];
    if (!config) {
      throw new Error(`could not found creep(${name})`);
    }
    this._creepSpawn(config.room, name, bodiesMap[config.role]);

    config.spwaning = true;
  }

  creepSpawn<T extends Record<string, any> = Record<string, any>>(
    role: RoleName,
    room: string
  ) {
    const name = `${role}_${String(Game.time).slice(-5, -1)}${this.count}`;

    this._creepSpawn(room, name, bodiesMap[role]);

    const config = {
      role,
      room,
      spwaning: true,
      cursor: 0,
    } as CreepData<T>;

    this._memory.creeps[name] = config;

    this.count++;

    return config;
  }

  checkAndCreateRoles() {
    Object.values(this._roles).forEach((it) => it?.checkAndCreate());
  }
}

const context = new Context();

export default context

global.context = context
