import { RoleName, Role } from "../types";
import collector from "./collector";
import harverster from "./harverster";

// @ts-ignore
const roles: Record<RoleName, Role> = {
  [RoleName.HARVERSTER]: harverster,
  // [RoleName.BUILDER]: harverster,
  [RoleName.COLLECTOR]: collector,
  // [RoleName.REPAIRER]: harverster,
  // [RoleName.UPGRADER]: harverster,
};
export default roles;
