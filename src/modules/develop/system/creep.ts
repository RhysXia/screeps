import { Subscribes, RoleName } from "../types";

const bodiesMap: Record<RoleName, Array<BodyPartConstant>> = {
  harverster: [WORK, CARRY, MOVE],
  collector: [WORK, CARRY, MOVE],
  upgrader: [WORK, CARRY, MOVE],
  repairer: [WORK, CARRY, MOVE],
  builder: [WORK, CARRY, MOVE],
};

const creep: Subscribes = {
  onCreepSpawn({ name, code }) {
    if (code === ERR_NAME_EXISTS) {
      return;
    }
    if (code !== OK) {
      delete this.memory.creeps[name];
      return;
    }
    this.memory.creeps[name].spawning = false;
  },
  creepRemove(name) {
    delete this.memory.creeps[name]
  },
  creepSpawn({ room, role, ...others }) {
    const memory = this.memory.creeps;

    const bodies = bodiesMap[role];
    const name = `${role}_${String(Game.time).slice(-5, -1)}${
      Object.keys(memory).length
    }`;

    memory[name] = {
      ...others,
      role,
      room,
      cursor: 0,
      spawning: true,
    } as any;

    this.modules.creepSpawn.spawn(room, name, bodies);
  },
  creepReSpawn(name) {
    const config = this.memory.creeps[name];
    if (!config) {
      throw new Error(`could not found creep(${name})`);
    }

    this.modules.creepSpawn.spawn(config.room, name, bodiesMap[config.role]);

    config.spawning = true;
  },
};

export default creep;
