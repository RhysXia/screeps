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



const createRole = (roleName: RoleName) => {
  const Role = roleMap[roleName];

  const creep = Role.create();

  const role = new Role(creep);
};
