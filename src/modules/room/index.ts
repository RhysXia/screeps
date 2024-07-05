import { defineScreepModule } from "core/module";

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

export default defineScreepModule<
  {},
  RoomModuleExport,
  Record<string, Record<string, any>>
>({
  name: moduleName,
  binding() {
    const memory = this.memory;
    return {
      getRoomConfig(room) {
        if (!Game.rooms[room]) {
          delete memory[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = memory[room];
        if (!roomConfig) {
          return undefined;
        }

        return roomConfig[this.targetModuleName];
      },
      setRoomConfig(room, v) {
        if (!Game.rooms[room]) {
          delete memory[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = (memory[room] = memory[room] || {});

        roomConfig[this.targetModuleName] = v;
      },
    };
  },
  postProcess() {
    // 隔5个ticks，清理一次memory
    if (Game.time % 5) {
      const memory = this.memory;
      Object.keys(memory).forEach((name) => {
        if (!Game.rooms[name]) {
          delete memory[name];
        }
      });
    }
  },
});
