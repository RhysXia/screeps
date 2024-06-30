import { EnhancedCreep } from "../EnhancedCreep";
import { RoleWork } from "../types";

const work: RoleWork = (creep: EnhancedCreep) => {
  creep.room.find(FIND_SOURCES_ACTIVE)
  
};

export default work;
