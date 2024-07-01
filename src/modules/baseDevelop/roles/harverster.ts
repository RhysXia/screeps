import plan from "../plan";
import { Role, RoleName } from "../types";

const harverster: Role<{
  sourceId: Source["id"];
  targetId?: ConstructionSite["id"] | StructureContainer["id"];
}> = {
  create(createCreep) {
    _.forEach(Game.spawns, (spawn) => {
      const room = spawn.room;
      const creepConfigs = Object.values(Memory.creepConfig);
      const sources = room
        .find(FIND_SOURCES_ACTIVE)
        .map((s) => {
          if (creepConfigs.some((it) => it.sourceId == s.id)) {
            return;
          }
          return {
            sourceId: s.id,
          };
        })
        .filter(Boolean);

      sources.forEach((s, i) => {
        const name = `${room.name}_harverster_${i}${Game.time}`;
        Memory.creepConfig[name] = {
          role: RoleName.HARVERSTER,
          room: room.name,
          sourceId: s.sourceId,
          spwaning: true,
        };
        createCreep(name, room.name, [WORK, CARRY, MOVE]);
      });
    });
  },
  prepare(creep, config) {
    const { sourceId, targetId } = config;

    const source = Game.getObjectById<Source>(sourceId);

    const containers = source.pos.findInRange<StructureContainer>(
      FIND_STRUCTURES,
      1,
      {
        filter: (it) => it.structureType === STRUCTURE_CONTAINER,
      }
    );

    let target: StructureContainer | ConstructionSite | undefined;

    if (containers.length) {
      target = containers[0];
    }

    if (!target) {
      const constructionSites = source.pos.findInRange(
        FIND_CONSTRUCTION_SITES,
        1,
        {
          filter: (it) => it.structureType === STRUCTURE_CONTAINER,
        }
      );

      if (constructionSites.length) {
        target = constructionSites[0];
      }
    }

    if (target) {
      config.targetId = target.id;
    }

    // 还没有target
    const range = target ? 0 : 1;

    creep.moveTo((target || source).pos);

    return creep.pos.inRangeTo((target || source).pos, range);
  },
  plans: [
    // 维护
    (creep, config) => {
      const { targetId, sourceId } = config;

      const source = Game.getObjectById(sourceId);

      // 没有能量就进行采集，因为是维护阶段，所以允许采集一下工作一下
      if (creep.store[RESOURCE_ENERGY] <= 0) {
        creep.harvest(source);
        return false;
      }

      let target: ConstructionSite | StructureContainer = targetId
        ? Game.getObjectById<ConstructionSite | StructureContainer>(targetId)
        : undefined;

      // 没有 container
      if (!target) {
        creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
        target = creep.pos
          .lookFor(LOOK_CONSTRUCTION_SITES)
          .find((s) => s.structureType === STRUCTURE_CONTAINER);
      }

      if (!target) {
        target = creep.pos
          .lookFor(LOOK_STRUCTURES)
          .find(
            (s) => s.structureType === STRUCTURE_CONTAINER
          ) as StructureContainer;
      }

      if (!target) {
        return;
      }

      config.targetId = target.id;

      // 先修理
      if (target instanceof StructureContainer) {
        creep.repair(target);
        return target.hits >= target.hitsMax ? 1 : 0;
      }

      creep.build(target);
    },
    // 疯狂挖矿，多了会自动掉落，被container收集
    (creep, config) => {
      const { sourceId } = config;

      const source = Game.getObjectById<Source>(sourceId);

      const result = creep.harvest(source);

      if (result !== OK) {
        console.error(`creep(${creep.name}) harvest error (${result})`);
      }

      // 快挂了，扔掉资源
      if (creep.ticksToLive < 2) {
        creep.drop(RESOURCE_ENERGY);
        plan.addTask(creep.name, config.room, [WORK, CARRY, MOVE]);
      }
    },
  ],
};

export default harverster;
