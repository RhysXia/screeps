import { CreepTaskAddTask } from "modules/creepTask";
import { RoleName } from "./types";

class Plan {
  private addTask: CreepTaskAddTask;

  setAddTask(addTask: CreepTaskAddTask) {
    this.addTask = addTask;
  }

  refresh() {
    _.forEach(Game.spawns, (spawn) => {
      const room = spawn.room;
      const sources = room.find(FIND_SOURCES_ACTIVE).map((s) => {
        const nearLinks = s.pos.findInRange<StructureLink>(
          FIND_MY_STRUCTURES,
          2,
          {
            filter: (s) => s.structureType === STRUCTURE_LINK,
          }
        );
        return {
          sourceId: s.id,
          linkId: nearLinks.length ? nearLinks[0].id : undefined,
        };
      });
      sources.forEach((s, i) => {
        const name = `${room.name}_harverster_${i}${Game.time}`;
        Memory.creepConfig[name] = {
          role: RoleName.HARVERSTER,
          room: room.name,
          sourceId: s.sourceId,
          targetId: s.linkId,
        };
        this.addTask(name, room.name, [WORK, CARRY, MOVE]);
      });

      console.log( Object.keys(Memory.creepConfig))
    });
  }
}

export default new Plan();
