import { warning } from "core/logger";
import { defineScreepModule } from "core/module_back";
import {
  moduleName as creepSpawnModule,
  CreepSpawnModuleExport,
} from "modules/creepSpawn";

export type DefenderModuleExport = {
  binding: {
    defense(room: string): void;
  };
};

export const moduleName = "defender";

export default defineScreepModule<
  {
    [creepSpawnModule]: CreepSpawnModuleExport;
  },
  DefenderModuleExport
>({
  name: moduleName,
  inject: [creepSpawnModule],
  binding() {
    return {
      defense(roomName) {
        const room = Game.rooms[roomName];

        if (!room) {
          warning(`not found room(${roomName})`);
          return;
        }
        const creeps = room.find(FIND_HOSTILE_CREEPS);

        if (creeps.length) {
          warning("has invader");
        }
      },
    };
  },
});
