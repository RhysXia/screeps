import { defineScreepsModule, ScreepsModuleExportContext } from "core/module";

export enum RoomChange {
  ADD,
  DELETE,
}

export type RoomListener = (name: string, code: RoomChange) => void;

export type RoomModuleExport = Record<
  "binding" | "initialize" | "process",
  {
    getRoomConfig<T extends any = any>(room: string): T;
    setRoomConfig<T extends any = any>(room: string, v: T): void;
  }
>;

export const moduleName = "room";

export default defineScreepsModule<
  {},
  RoomModuleExport,
  Record<string, Record<string, any>>
>(moduleName)(({ memory }) => {
  const createExports = ({ targetModuleName }: ScreepsModuleExportContext) => {
    return {
      getRoomConfig(room: string) {
        if (!Game.rooms[room]) {
          delete memory[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = memory[room];
        if (!roomConfig) {
          return undefined;
        }

        return roomConfig[targetModuleName];
      },
      setRoomConfig(room: string, v: any) {
        if (!Game.rooms[room]) {
          delete memory[room];
          throw new Error(`room(${room}) not found`);
        }

        const roomConfig = (memory[room] = memory[room] || {});

        roomConfig[targetModuleName] = v;
      },
    };
  };


  return {
    binding() {
      return createExports;
    },
    initialize() {
      return createExports;
    },
    process() {
      return createExports;
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
  };
});
