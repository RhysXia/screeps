import { RoleName, Role } from "../types";
import builder from "./builder";
import collector from "./collector";
import harverster from "./harverster";
import upgrader from "./upgrader";

// @ts-ignore
const roles: Record<RoleName, Role> = {
  harverster,
  builder,
  collector,
  // [RoleName.REPAIRER]: harverster,
  upgrader,
};
export default roles;
