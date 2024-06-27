import { Harvester } from "./Harvester";
import { AbstractRole } from "./AbstractRole";


const roleMap: Record<
  RoleName,
  {
    new (creep: Creep): AbstractRole;
    create(): Creep;
  }
> = {
  harvester: Harvester,
  builder: Harvester,
  collector: Harvester,
  miner: Harvester,
  repairer: Harvester,
  upgrader: Harvester,
};

declare global {
  interface CreepMemory {
    role: RoleName;
  }

  interface Creep {
    role: AbstractRole;
  }
}

const createRole = (roleName: RoleName) => {
  const Role = roleMap[roleName];

  const creep = Role.create();

  const role = new Role(creep);
};
