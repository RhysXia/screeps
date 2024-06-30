import { defineScreepModule } from "core/module";
import { CreepModuleExport } from "modules/creep";

export type DevelopModuleExport = {};

const develop = defineScreepModule<
  {
    creep: CreepModuleExport;
  },
  DevelopModuleExport
>({
  name: "develop",
  inject: ["creep"],

  postProcess(ctx) {
    ctx.creep.creepTask.addTask("demo1", "sim", [WORK, CARRY, MOVE]);
  },
});

export default develop;
