import { CreepTaskAddTask } from "modules/creepTask";
import roles from "./roles";

class Plan {
  addTask: CreepTaskAddTask;

  setAddTask(addTask: CreepTaskAddTask) {
    this.addTask = addTask;
  }

  refresh() {
    Object.values(roles).forEach((role) => {
      role.create(this.addTask);
    });
  }
}

const plan = new Plan();

export default plan;

global.plan = plan;
