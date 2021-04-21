export const loop = () => {
  if (Object.keys(Game.creeps).length < 3) {
    const name = Object.keys(Game.spawns)[0];
    const id = Date.now().toString().slice(-4);
    Game.spawns[name].spawnCreep([WORK, MOVE, CARRY], `haverster${id}`);
  }

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
