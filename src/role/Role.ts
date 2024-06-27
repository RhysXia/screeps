import { RoleName } from "./types";

export abstract class Role {
  constructor(protected readonly creep: Creep) {}

  abstract run(): void;

  static create() {
    
  }
}
