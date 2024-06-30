import { EnhancedCreep } from "../EnhancedCreep";
import { RoleWork } from "../types";

const work: RoleWork = (creep: EnhancedCreep) => {
  creep.say("I'm working");
};

export default work;
