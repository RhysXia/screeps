import { Role } from "../types";

const harverster: Role = {
  source(creep) {
    const { sourceId, targetId } = Memory.creepConfig[creep.name];

    const source = Game.getObjectById<Structure | Source>(sourceId);

    let result: ScreepsReturnCode;

    if (source instanceof Structure) {
      result = creep.withdraw(source, RESOURCE_ENERGY);
    } else {
      result = creep.harvest(source);
    }

    if (result === OK) {
    }

    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
      console.log('----------------')
    }

    return creep.store.getFreeCapacity() > 0;
  },
};

export default harverster;
