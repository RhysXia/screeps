import { Role } from "../types";

export type CollectorConfigData = {
  sourceId: StructureContainer["id"];
  targetId: StructureSpawn["id"];
};

const collector: Role<"collector"> = {
  messages: {
    moduleInit() {
      _.forEach(Game.spawns, (spawn) => {
        const room = spawn.room;
        const creepConfigs = Object.values(this.memory.creeps);
        const sources = room
          .find(FIND_SOURCES_ACTIVE)
          .map((s) => {
            if (creepConfigs.some((it) => it.sourceId == s.id)) {
              return;
            }
            return {
              sourceId: s.id,
            };
          })
          .filter(Boolean);

        sources.forEach((s) => {
          this.publish("spawn", {
            role: RoleName.HARVERSTER,
            room: room.name,
            config: {
              sourceId: s.sourceId,
            },
          });
        });
      });
    },
  },
  plans: [() => {}],
};

export default collector;
