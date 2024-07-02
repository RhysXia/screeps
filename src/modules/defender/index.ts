import { defineScreepModule } from "core/module";
import {
  moduleName as creepSpawnModule,
  CreepSpawnModuleExport,
} from "../creepSpawn";

export type DefenderModuleExport = {
  binding: {
    checkInvade(room: string): void;
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
  binding({ [creepSpawnModule]: { spawn } }) {
    return {
      checkInvade(roomName) {
        const room = Game.rooms[roomName];

        if (!room) {
          console.error(`not found room(${roomName})`);
          return;
        }
        const creeps = room.find(FIND_HOSTILE_CREEPS);

        if (creeps.length) {
          console.error("has invader");
        }
      },
    };
  },
  postProcess() {},
});
