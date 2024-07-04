import { warning } from "core/logger";
import { Role } from "../types";
import { CollectorConfigData } from "./collector";

const harverster: Role<"harverster"> = {
  messages: {
    moduleInit() {
      _.forEach(Game.spawns, (spawn) => {
        const room = spawn.room;
        const creepConfigs = Object.values(this.memory.creeps);
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

        sources.forEach((s) => {
          this.publish("spawn", {
            role: "harverster",
            room: room.name,
            sourceId: s.sourceId,
          });
        });
      });
    },
  },
  plans: [
    // 移动到目的地
    function (creep, config) {
      // 记录开始移动的时间
      config.startTick = config.startTick || Game.time;

      const { sourceId, targetId } = config;

      if (targetId) {
        const target = Game.getObjectById(targetId);
        if (target) {
          creep.moveTo(target.pos);

          return creep.pos.inRangeTo(target.pos, 0) ? 1 : 0;
        }
      }

      let target: StructureContainer | ConstructionSite | undefined;

      const source = Game.getObjectById<Source>(sourceId);

      const containers = source.pos.findInRange<StructureContainer>(
        FIND_STRUCTURES,
        1,
        {
          filter: (it) => it.structureType === STRUCTURE_CONTAINER,
        }
      );

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

      return creep.pos.inRangeTo((target || source).pos, range) ? 1 : 0;
    },
    // 维护
    function (creep, config) {
      // 记录移动花费的总时间
      config.walkTick = config.walkTick || Game.time - config.startTick;

      const { targetId, sourceId } = config;

      const source = Game.getObjectById(sourceId);

      // 提前孵化
      if (creep.ticksToLive < config.walkTick || 2) {
        this.publish("spawn", {
          role: "harverster",
          room: config.room,
          sourceId: config.sourceId,
          targetId: config.targetId,
        });
      }

      // 没有能量就进行采集，因为是维护阶段，所以允许采集一下工作一下
      if (creep.store[RESOURCE_ENERGY] <= 0) {
        const code = creep.harvest(source);

        // 应该不会出现这种情况
        if (code === ERR_NOT_IN_RANGE) {
          warning(
            `creep(${creep.name}) could not harverst, because of out of range`
          );
          return -1;
        }
        return;
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
        // 判断是否需要 collector
        const creeps = this.memory.creeps;

        if (
          Object.values(creeps).every(
            (it) =>
              it.role !== "collector" ||
              (it as CollectorConfigData).sourceId !== target.id
          )
        ) {
          this.publish("spawn", {
            room: config.room,
            role: "collector",
            sourceId: target.id,
          });
        }

        const code = creep.repair(target);
        if (code === ERR_NOT_IN_RANGE) {
          warning(
            `creep(${creep.name}) could not harverst, because of out of range`
          );
          return -1;
        }
        return target.hits >= target.hitsMax ? 1 : 0;
      }

      creep.build(target);
    },
    // 疯狂挖矿，多了会自动掉落，被container收集
    function (creep, config) {
      const { sourceId, walkTick } = config;

      if (creep.ticksToLive < walkTick || 2) {
        this.publish("spawn", {
          role: "harverster",
          room: config.room,
          sourceId: config.sourceId,
          targetId: config.targetId,
        });
      }

      const source = Game.getObjectById<Source>(sourceId);

      const code = creep.harvest(source);

      if (code === ERR_NOT_IN_RANGE) {
        return -2;
      }

      if (code !== OK) {
        warning(`creep(${creep.name}) harvest error (${code})`);
      }

      // 快挂了，扔掉资源
      if (creep.ticksToLive < 2) {
        creep.drop(RESOURCE_ENERGY);
      }
    },
  ],
};

export default harverster;
