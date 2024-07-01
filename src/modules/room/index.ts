import { defineScreepModule } from "core/module";

declare global {
  interface Memory {
    roomConfig: Record<string, Record<string, any>>;
  }
}

export enum RoomChange {
  ADD,
  DELETE,
}

export type RoomListener = (name: string, code: RoomChange) => void;

export type RoomModuleExport = {
  binding: {
    getRoomConfig<T extends any = any>(room: string): T;
    setRoomConfig<T extends any = any>(room: string, v: T): void;
  };
};

export const moduleName = "room";

export default defineScreepModule<{}, RoomModuleExport>({
  name: moduleName,
  binding() {
    return {
      getRoomConfig(room) {
        if (!Game.rooms[room]) {
          delete Memory.roomConfig[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = Memory.roomConfig[room];

        if (!roomConfig) {
          return undefined;
        }

        return roomConfig[this.targetModuleName];
      },
      setRoomConfig(room, v) {
        if (!Game.rooms[room]) {
          delete Memory.roomConfig[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = Memory.roomConfig[room] || {};

        Memory.roomConfig[room] = roomConfig;

        roomConfig[this.targetModuleName] = v;
      },
    };
  },
  initialize() {
    if (!Memory.roomConfig) {
      Memory.roomConfig = {};
    }
  },
  postProcess() {
    // 隔5个ticks，清理一次memory
    if (Game.time % 5) {
      Object.keys(Memory.roomConfig).forEach((name) => {
        if (!Game.rooms[name]) {
          delete Memory.roomConfig[name];
        }
      });
    }
  },
});
