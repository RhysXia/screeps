import context from "../system/spawn";
import { Role, RoleName } from "../types";

export type CollectorConfigData = {
  sourceId: StructureContainer["id"];
  targetId: StructureSpawn["id"];
};

const collector: Role<CollectorConfigData> = {
  messages: {},
  plans: [() => {

  }],
};

export default collector;
