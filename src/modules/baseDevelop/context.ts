import { CreepSpawnFn } from "modules/creepSpawn";
import { CreepConfigItem, Role, RoleName } from "./types";

// @ts-ignore
const bodiesMap: Record<RoleName, Array<BodyPartConstant>> = {
  [RoleName.HARVERSTER]: [WORK, CARRY, MOVE],
};

class Context {
  private _creepSpawn: CreepSpawnFn;
  private _roles: Record<RoleName, Role>;
  private i = 0;

  update() {
    this.i = 0;
  }

  setCreepSpawn(creepSpawn: CreepSpawnFn) {
    this._creepSpawn = creepSpawn;
  }

  setRoles(roles: Record<RoleName, Role>) {
    this._roles = roles;
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
    this._creepSpawn(config.room, name, bodiesMap[config.role]);

    config.spwaning = true;
  }

  creepSpawn<T extends Record<string, any> = Record<string, any>>(
    role: RoleName,
    room: string
  ) {
    const name = `${room}_${role}_${Game.time}${this.i}`;

    this._creepSpawn(room, name, bodiesMap[role]);

    const config = {
      role,
      room,
      spwaning: true,
      cursor: 0,
    } as CreepConfigItem<T>;

    Memory.creepConfig[name] = config;

    this.i++;

    return config;
  }

  checkAndCreateRoles() {
    Object.values(this._roles).forEach((it) => it.create());
  }
}

export default new Context();
