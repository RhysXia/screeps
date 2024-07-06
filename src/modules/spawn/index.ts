import { defineScreepModule } from "core/module_back";
import { RoomModuleExport, moduleName as roomModuleName } from "../room";

export type SpawnModuleExport = {
  binding: {
    getSpawnIdsByRoom(room: string): Array<StructureSpawn["id"]>;
  };
};

type RoomConfig = Array<StructureSpawn["id"]>;

export const moduleName = "spawn";

export default defineScreepModule<
  {
    [roomModuleName]: RoomModuleExport;
  },
  SpawnModuleExport
>({
  name: moduleName,
  inject: [roomModuleName],
  binding() {
    const { getRoomConfig } = this.modules[roomModuleName];

    return {
      getSpawnIdsByRoom(room) {
        const spawnIds = getRoomConfig<RoomConfig>(room);
        return spawnIds || [];
      },
    };
  },
  initialize() {
    const map = new Map<string, RoomConfig>();
    for (const name in Game.spawns) {
      const spawn = Game.spawns[name];

      const roomName = spawn.room.name;

      const array = map.get(roomName) || [];

      array.push(spawn.id);

      map.set(roomName, array);
    }

    const { setRoomConfig } = this.modules[roomModuleName];

    map.forEach((array, name) => {
      setRoomConfig<RoomConfig>(name, array);
    });
  },
});
