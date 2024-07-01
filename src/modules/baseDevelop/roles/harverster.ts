import { Role, RoleName } from "../types";

const harverster: Role<{sourceId: Source['id'] | Structure['id'], targetId?: StructureLink['id'] | StructureContainer['id']}> = {
  create(createCreep) {
    _.forEach(Game.spawns, (spawn) => {
      const room = spawn.room;
      const creepConfigs = Object.values(Memory.creepConfig)
      const sources = room.find(FIND_SOURCES_ACTIVE).map((s) => {
        if(creepConfigs.some(it => it.sourceId == s.id)) {
          return
        }

        const targets = s.pos.findInRange<StructureLink>(
          FIND_MY_STRUCTURES,
          2,
          {
            filter: (s) => s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER,
          }
        );
        return {
          sourceId: s.id,
          targetId: targets.length ? targets[0].id : undefined,
        };
      }).filter(Boolean);

      sources.forEach((s, i) => {
        const name = `${room.name}_harverster_${i}${Game.time}`;
        Memory.creepConfig[name] = {
          role: RoleName.HARVERSTER,
          room: room.name,
          sourceId: s.sourceId,
          targetId: s.targetId,
        };
        createCreep(name, room.name, [WORK, CARRY, MOVE]);
      });
    });
  },
  prepare(creep, config) {
    const {} = config

    return true
  },
  plans: [
    // 第一步挖矿
    (creep, config) => {
      const { sourceId } = config;

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
      }

      return creep.store.getFreeCapacity() > 0 ? 1 : 0;
    },
    // 运送
    (creep, config) => {
      const { targetId } = config;

      // 没有target， 运送到 spawn
      if (!targetId) {
        Game.
      }
    },
  ],
};

export default harverster;
