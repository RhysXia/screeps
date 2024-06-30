import { Role, RoleWork } from "../types";
import harverster from "./harverster";

const roles: Record<Role, RoleWork> = {
    [Role.HARVERSTER]: harverster,
    [Role.BUILDER]: harverster,
    [Role.COLLECTOR]: harverster,
    [Role.REPAIRER]: harverster,
    [Role.UPGRADER]: harverster,
};

export default roles;
