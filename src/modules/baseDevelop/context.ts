import { CreepTaskAddTask } from "modules/creepTask";

class Context {
  addTask: CreepTaskAddTask;
  setAddTask(addTask: CreepTaskAddTask) {
    this.addTask = addTask;
  }
}

export default new Context();
