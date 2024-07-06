import { defineScreepsModule } from "core/module";
import { RoomModuleExport, moduleName as roomModuleName } from "../room";

export type SourceModuleExport = {
  binding: {
    getSourceIdsByRoom(room: string): Array<Source["id"]>;
  };
};

type RoomConfig = Array<Source["id"]>;

export const moduleName = "source";

export default defineScreepsModule<
  {
    [roomModuleName]: RoomModuleExport;
  },
  SourceModuleExport
>(moduleName, [roomModuleName])(() => {
  const createExport = ({
    [roomModuleName]: { getRoomConfig, setRoomConfig },
  }: {
    [roomModuleName]: RoomModuleExport["binding"];
  }) => {
    return {
      getSourceIdsByRoom(roomName: string) {
        const sourceIds = getRoomConfig<RoomConfig>(roomName);

        if (sourceIds) {
          return sourceIds;
        }

        const room = Game.rooms[roomName];

        const newSourceIds = room.find(FIND_SOURCES).map((it) => it.id);

        setRoomConfig<RoomConfig>(roomName, newSourceIds);

        return newSourceIds;
      },
    };
  };

  return {
    binding(ctx) {
      return createExport(ctx);
    },
    initialize(ctx) {
      return createExport(ctx);
    },
    process(ctx) {
      return createExport(ctx);
    },
  };
});
