import { CreepStateMachine } from "common/CreepStateMachine";
import harverster from ".";

export type CreepConfig = {
  room: string;
  sourceId: Source["id"];
  targetId?: StructureContainer["id"] | ConstructionSite["id"] | Source["id"];
  spawning?: true;
  action?: "prepare" | "build" | "pick" | "tempPick";
  spawnTime: number;
  waitTime?: number;
};

export default new CreepStateMachine<
  typeof harverster,
  "build" | "pick" | "tempPick",
  CreepConfig
>({
  prepare(creep, config) {
    const { targetId, sourceId } = config;

    let target: Source | StructureContainer | ConstructionSite = targetId
      ? Game.getObjectById(targetId)
      : undefined;

    if (!target) {
      const source = Game.getObjectById(sourceId);

      const containers = source.pos.findInRange<StructureContainer>(
        FIND_STRUCTURES,
        1,
        {
          filter: (it) => it.structureType === STRUCTURE_CONTAINER,
        }
      );

      target = containers[0];

      if (!target) {
        const constructionSites = source.pos.findInRange(
          FIND_CONSTRUCTION_SITES,
          1,
          {
            filter: (it) => it.structureType === STRUCTURE_CONTAINER,
          }
        );
        target = constructionSites[0];
      }

      if (!target) {
        target = source;
      }
    }

    creep.moveTo(target);

    config.targetId = target.id;

    const isSource = target instanceof Source;

    if (creep.pos.inRangeTo(target, isSource ? 1 : 0)) {
      if (isSource) {
        creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
        config.targetId = creep.pos
          .lookFor(LOOK_CONSTRUCTION_SITES)
          .find((s) => s.structureType === STRUCTURE_CONTAINER).id;
      }

      config.waitTime = Game.time - config.spawnTime;

      return "tempPick";
    }
  },
  tempPick(creep, config) {
    const { sourceId } = config;

    const source = Game.getObjectById(sourceId);

    creep.harvest(source);

    if (creep.store.getFreeCapacity() <= 0) {
      return "build";
    }
  },
  build(creep, config) {
    const { targetId } = config;

    const target = Game.getObjectById(targetId) as
      | ConstructionSite
      | StructureContainer;

    if (target instanceof ConstructionSite) {
      creep.build(target);
      if (target.progress >= target.progressTotal) {
        return "pick";
      }
    } else {
      creep.repair(target);
      if (target.hits >= target.hitsMax) {
        return "pick";
      }
    }

    if (creep.store.getUsedCapacity() <= 0) {
      return "tempPick";
    }
  },
  pick(creep, config) {
    const { sourceId } = config;

    const source = Game.getObjectById(sourceId);

    creep.harvest(source);
  },
});
