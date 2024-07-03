import context from "../context";
import { Role, RoleName } from "../types";

export type CollectorConfigData = {
  sourceId: StructureContainer["id"];
  targetId: StructureSpawn["id"];
};

const collector: Role<CollectorConfigData> = {
  plans: [() => {}],
};

export default collector;
