import { CreepTaskAddTask } from "modules/creepTask";
import roles from "./roles";

class Plan {
  private addTask: CreepTaskAddTask;

  setAddTask(addTask: CreepTaskAddTask) {
    this.addTask = addTask;
  }

  refresh() {
    Object.values(roles).forEach((role) => {
      role.create(this.addTask);
    });
  }
}

export default new Plan();
