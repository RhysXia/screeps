import { AbstractRole } from "./AbstractRole";
import { RoleName } from "./types";

export class Harvester extends AbstractRole {
   roleName = ''
  run(): void {}

}

Harvester.create = () => {

    return Game.spawns.name.spawnCreep([], 'a', )
}