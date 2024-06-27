import { Harvester } from "./Harvester";
import { RoleClass, RoleName } from "./types";

export const roleClassMap: Record<RoleName, RoleClass> = {
  builder: Harvester,
  collector: Harvester,
  harvester: Harvester,
  miner: Harvester,
  repairer: Harvester,
  upgrader: Harvester,
};

export const initialize = () => {
  if (global.isRoleInited) {
    return;
  }

  global.isRoleInited = true;

  Object.defineProperty(Creep.prototype, "role", {
    get() {
      const role = this._role;
      if (role) {
        return role;
      }
      const creep = this as Creep;

      const roleName = creep.memory.role;

      if (!roleName) {
        console.error(`unknown creep role: ${creep.name}`);
      }

      const RoleClass = roleClassMap[roleName];

      const newRole = new RoleClass(creep);

      this._role = newRole;

      return newRole;
    },
  });
};

export const run = () => {
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    creep.role.run();
  }
};
