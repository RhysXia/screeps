import { defineScreepModule } from "core/module";
import { RoomModuleExport, moduleName as roomModuleName } from "../room";

export type SourceModuleExport = {
  binding: {
    getSourceIdsByRoom(room: string): Array<Source["id"]>;
  };
};

type RoomConfig = Array<Source["id"]>;

export const moduleName = "source";

export default defineScreepModule<
  {
    [roomModuleName]: RoomModuleExport;
  },
  SourceModuleExport
>({
  name: moduleName,
  inject: [roomModuleName],
  binding() {
    const { getRoomConfig } = this.modules[roomModuleName];

    return {
      getSourceIdsByRoom(room) {
        const sourceIds = getRoomConfig<RoomConfig>(room);
        return sourceIds || [];
      },
    };
  },
  initialize() {
    const { setRoomConfig } = this.modules[roomModuleName];
    for (const name in Game.rooms) {
      const room = Game.rooms[name];

      const sourceIds = room.find(FIND_SOURCES).map((it) => it.id);

      setRoomConfig<RoomConfig>(name, sourceIds);
    }
  },
});
