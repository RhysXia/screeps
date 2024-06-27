export const loop = () => {
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    const sources = Game.rooms[0].find(FIND_SOURCES);

    if (creep.store.getFreeCapacity() <= 0) {
      if (
        creep.upgradeController(Game.rooms[0].controller) === ERR_NOT_IN_RANGE
      ) {
        creep.moveTo(Game.rooms[0].controller);
      }
    } else {
      if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0]);
      }
    }
  }
};
