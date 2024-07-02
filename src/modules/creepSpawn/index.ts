import { defineScreepModule } from "core/module";
import { SpawnModuleExport, moduleName as spawnModuleName } from "../spawn";
import { RoomModuleExport, moduleName as roomModuleName } from "../room";

export enum CreepSpawnPriority {
  HIGH = 0,
  NORMAL = 1,
  LOW = 2,
}

export type CreepSpawnListener = (
  name: string,
  code: ScreepsReturnCode
) => void;

export type CreepSpawnFn = (
  room: string,
  name: string,
  bodies: Array<BodyPartConstant>,
  priority?: CreepSpawnPriority
) => void;

export type CreepSpawnModuleExport = {
  binding: {
    onSpawn(fn: CreepSpawnListener): void;
    spawn: CreepSpawnFn;
  };
};

export enum CreepSpawnCode {
  OK,
  ERR_ROOM_NOT_FOUND,
  ERR_NAME_EXIST,
}

const ALL_BODIES: Array<BodyPartConstant> = [
  MOVE,
  CARRY,
  WORK,
  ATTACK,
  RANGED_ATTACK,
  TOUGH,
  HEAL,
  CLAIM,
];

type RoomConfig = Array<{ n: string; b: Array<number>; p: CreepSpawnPriority }>;

const listeners: Array<CreepSpawnListener> = [];

const callListeners: CreepSpawnListener = (name, code) => {
  listeners.forEach((it) => it(name, code));
};

export const moduleName = "creepSpawn";

export default defineScreepModule<
  {
    [spawnModuleName]: SpawnModuleExport;
    [roomModuleName]: RoomModuleExport;
  },
  CreepSpawnModuleExport
>({
  name: moduleName,
  inject: [spawnModuleName, roomModuleName],
  binding({
    [spawnModuleName]: { getSpawnIdsByRoom },
    [roomModuleName]: { getRoomConfig, setRoomConfig },
  }) {
    return {
      onSpawn(fn) {
        listeners.push(fn);
      },
      spawn(room, name, bodies, priority = CreepSpawnPriority.NORMAL) {
        const spawnIds = getSpawnIdsByRoom(room);
        if (!spawnIds.length) {
          throw new Error(`no StructureSpawn in room(${room})`);
        }

        const queue = getRoomConfig<RoomConfig>(room) || [];

        let i = 0;

        for (; i < queue.length; i++) {
          const task = queue[i];
          if (priority < task.p) {
            break;
          }
        }

        queue.splice(i, 0, {
          n: name,
          b: bodies.map((it) => ALL_BODIES.indexOf(it)),
          p: priority,
        });

        setRoomConfig<RoomConfig>(room, queue);
      },
    };
  },
  postProcess({
    self,
    [spawnModuleName]: { getSpawnIdsByRoom },
    [roomModuleName]: { getRoomConfig, setRoomConfig },
  }) {
    for (const roomName in Game.rooms) {
      const queue = getRoomConfig<RoomConfig>(roomName);

      if (!queue || !queue.length) {
        continue;
      }

      const spawns = getSpawnIdsByRoom(roomName).map((it) =>
        Game.getObjectById<StructureSpawn>(it)
      );

      for (const spawn of spawns) {
        if (spawn.spawning) {
          continue;
        }

        const task = queue.pop();

        if (!task) {
          break;
        }

        const bodies = task.b.map((it) => ALL_BODIES[it]);

        const code = spawn.spawnCreep(bodies, task.n, {});

        if (code === ERR_NOT_ENOUGH_ENERGY) {
          self.spawn(roomName, task.n, bodies, task.p);
          continue;
        }

        callListeners(task.n, code);
      }
    }
  },
});
