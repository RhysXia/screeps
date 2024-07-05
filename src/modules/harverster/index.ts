import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepModuleName,
} from "modules/creepSpawn";
import {
  SourceModuleExport,
  moduleName as sourceModuleName,
} from "modules/source";
import plans, { CreepConfig } from "./plans";

export type HarversterModuleExport = {};

export const moduleName = "harverster";

export type HarversterMemory = {
  creeps: Record<string, CreepConfig>;
};

export default defineScreepModule<
  {
    [creepModuleName]: CreepSpawnModuleExport;
    [sourceModuleName]: SourceModuleExport;
  },
  HarversterModuleExport,
  HarversterMemory
>({
  name: moduleName,
  inject: [creepModuleName, sourceModuleName],
  binding() {
    const { onSpawn } = this.modules[creepModuleName];
    const creeps = this.memory.creeps;
    onSpawn((name, code) => {
      if (!creeps[name]) {
        return;
      }
      if (code === ERR_NAME_EXISTS) {
        return;
      }
      if (code !== OK) {
        delete creeps[name];
        return;
      }
      delete creeps[name].spawning;
      creeps[name].spawnTime = Game.time;
    });
  },
  initialize() {
    // 初始化数据
    const creeps = (this.memory.creeps = this.memory.creeps || {});

    const { spawn: spawnFn } = this.modules[creepModuleName];
    const { getSourceIdsByRoom } = this.modules[sourceModuleName];

    _.forEach(Game.spawns, (spawn, si) => {
      const room = spawn.room;
      const creepConfigs = Object.values(creeps);
      const sourceIds = getSourceIdsByRoom(room.name).filter(
        (it) => !creepConfigs.some((c) => c.sourceId === it)
      );

      sourceIds.forEach((id, i) => {
        const name = `haverster_${Game.time.toString().slice(-4)}${si}${i}`;

        spawnFn(room.name, name, [WORK, CARRY, MOVE]);

        creeps[name] = {
          room: room.name,
          sourceId: id,
          spawning: true,
          spawnTime: Game.time
        };
      });
    });
  },
  process() {
    const creepConfigs = this.memory.creeps;

    Object.keys(creepConfigs).forEach((name) => {
      const config = creepConfigs[name];
      // 正在孵化，跳过
      if (config.spawning) {
        return;
      }

      const creep = Game.creeps[name];

      // creep 不存在，异常状况
      if (!creep) {
        return;
      }

      plans.invoke(this, creep, config);

      if(  creep.ticksToLive < )

      // 快挂了，扔掉资源，并删除配置
      if (creep.ticksToLive < 2) {
        creep.drop(RESOURCE_ENERGY);
        delete creepConfigs[name];
      }
    });
  },
});
