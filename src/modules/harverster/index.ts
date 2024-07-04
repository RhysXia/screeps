import { defineScreepModule } from "core/module";
import {
  CreepSpawnModuleExport,
  moduleName as creepModuleName,
} from "modules/creepSpawn";

export type HarversterModuleExport = {};

export const moduleName = "harverster";

export default defineScreepModule<
  {
    [creepModuleName]: CreepSpawnModuleExport;
  },
  HarversterModuleExport,
  {
    creeps: Record<
      string,
      {
        room: string;
        sourceId: Source["id"];
        spawning?: true;
      }
    >;
  }
>({
  name: moduleName,
  inject: [creepModuleName],
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
    });
  },
  initialize() {
    // 初始化数据
    const creeps = (this.memory.creeps = this.memory.creeps || {});

    const { spawn: spawnFn } = this.modules[creepModuleName];

    _.forEach(Game.spawns, (spawn, si) => {
      const room = spawn.room;
      const creepConfigs = Object.values(creeps);
      const sources = room
        .find(FIND_SOURCES_ACTIVE)
        .filter((s) => !creepConfigs.some((it) => it.sourceId === s.id));

      sources.forEach((s, i) => {
        const name = `haverster_${Game.time.toString().slice(-4)}${si}${i}`;

        spawnFn(room.name, name, [WORK, CARRY, MOVE]);
        creeps[name] = {
          room: room.name,
          sourceId: s.id,
          spawning: true,
        };
      });
    });
  },
  process() {
    
  }
});
