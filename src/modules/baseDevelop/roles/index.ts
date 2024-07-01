import { RoleName, Role } from "../types";
import harverster from "./harverster";

// @ts-ignore
const roles: Record<RoleName, Role> = {
  [RoleName.HARVERSTER]: harverster,
  // [RoleName.BUILDER]: harverster,
  // [RoleName.COLLECTOR]: harverster,
  // [RoleName.REPAIRER]: harverster,
  // [RoleName.UPGRADER]: harverster,
};
export default roles;
