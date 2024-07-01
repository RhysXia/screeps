import { defineScreepModule } from "core/module";
import { SpawnModuleExport, moduleName as spawnModuleName } from "../spawn";
import { RoomModuleExport, moduleName as roomModuleName } from "../room";

export type CreepSpawnListener = (
  name: string,
  code: ScreepsReturnCode
) => void;

export type CreepSpawnFn = (
  room: string,
  name: string,
  bodies: Array<BodyPartConstant>
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

type RoomConfig = Array<{ n: string; b: Array<number> }>;

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
      spawn(room, name, bodies) {
        const spawnIds = getSpawnIdsByRoom(room);
        if (!spawnIds.length) {
          throw new Error(`no StructureSpawn in room(${room})`);
        }

        const config = getRoomConfig<RoomConfig>(room) || [];

        config.push({ n: name, b: bodies.map((it) => ALL_BODIES.indexOf(it)) });

        setRoomConfig<RoomConfig>(room, config);
      },
    };
  },
  postProcess({
    [spawnModuleName]: { getSpawnIdsByRoom },
    [roomModuleName]: { getRoomConfig, setRoomConfig },
  }) {
    for (const roomName in Game.rooms) {
      const tasks = getRoomConfig<RoomConfig>(roomName);

      if (!tasks || !tasks.length) {
        return;
      }

      const spawns = getSpawnIdsByRoom(roomName).map((it) =>
        Game.getObjectById<StructureSpawn>(it)
      );

      for (const spawn of spawns) {
        if (spawn.spawning) {
          continue;
        }

        const task = tasks.pop();

        if (!task) {
          break;
        }

        const code = spawn.spawnCreep(
          task.b.map((it) => ALL_BODIES[it]),
          task.n,
          {}
        );

        if(code === ERR_NOT_ENOUGH_ENERGY) {
          tasks.push(task)
          continue
        }

        callListeners(task.n, code);
      }
    }
  },
});
