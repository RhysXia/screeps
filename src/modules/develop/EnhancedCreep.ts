import roles from "./roles";

export class EnhancedCreep extends Creep {
  work() {

    if (this.ticksToLive === CREEP_LIFE_TIME) return;

    // 正在出生，不做任何事
    if (this.spawning) {
      return;
    }

    const role = this.memory.role;

    roles[role](this);
  }
}
