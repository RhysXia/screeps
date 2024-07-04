import { CollectorData, Role } from "../types";

const collector: Role<"collector", "back"> = {
  subscribes: {},
  plans: {
    prepare(creep, config) {
      const { sourceId } = config;

      const source = Game.getObjectById(sourceId);

      creep.moveTo(source.pos);

      if (creep.pos.inRangeTo(source.pos, 1)) {
        if (creep.withdraw(source, RESOURCE_ENERGY) === OK) {
          return "back";
        }
      }
    },
    back(creep, config) {
      if (!config.targetId) {
        const spawnIds = this.modules.spawn.getSpawnIdsByRoom(config.room);

        const room = Game.rooms[config.room];

        const extensions = room.find<StructureExtension>(FIND_STRUCTURES, {
          filter: (it) => it.structureType === STRUCTURE_EXTENSION,
        });

        const extensionSites = room.find(FIND_CONSTRUCTION_SITES, {
          filter: (it) => it.structureType === STRUCTURE_EXTENSION,
        });

        if (extensionSites.length + extensions.length < 5) {
          // 呼叫builder建造
        }

        const spawns = spawnIds.map((it) =>
          Game.getObjectById<StructureSpawn>(it)
        );

        const targetIds = [
          ...extensions.map((it) => it.id),
          ...spawns.map((it) => it.id),
        ] as const;

        const occupyIds = Object.values(this.memory.creeps)
          .filter((it) => it.role === "collector")
          .map((it) => (it as CollectorData).targetId)
          .filter(Boolean);

        const targetId = targetIds.find((it) => occupyIds.includes(it as any));

        if (targetId) {
          config.targetId = targetId;
        } else {
          // 随机选一个
          config.targetId =
            targetIds[Math.floor(targetIds.length * Math.random())];
        }
      }

      const target = Game.getObjectById(config.targetId);

      creep.moveTo(target.pos);

      if (creep.pos.inRangeTo(target.pos, 1)) {
        creep.transfer(target, RESOURCE_ENERGY);
        delete config.targetId;
        return "prepare";
      }
    },
  },
};

export default collector;
