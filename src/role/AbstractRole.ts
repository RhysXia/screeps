import { RoleName } from "./types";

export abstract class AbstractRole {
  constructor(protected readonly creep: Creep) {}

  abstract run(): void;

  static create: () => Creep;

   roleName: RoleName;
}
