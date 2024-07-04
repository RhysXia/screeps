import baseDevelop from ".";
import message, { MessageType } from "./message";

type DevelopScreepModule = typeof baseDevelop;

type Message = typeof message;

export type RoleName =
  /**
   * 采集者
   */
  | "harverster"
  /**
   * 收集者
   */
  | "collector"
  /**
   * 升级者
   */
  | "upgrader"
  /**
   * 建造者
   */
  | "builder"
  /**
   * 维修着
   */
  | "repairer";

export type LifecycleBindContextThis = DevelopScreepModule["binding"] extends (
  this: infer C,
  ...args: any
) => any
  ? C & {
      publish: Message["publish"];
    }
  : never;

export type LifecycleProcessContextThis =
  DevelopScreepModule["binding"] extends (this: infer C, ...args: any) => any
    ? C & {
        publish: Message["publish"];
      }
    : never;

export type Subscribes = {
  [K in keyof MessageType]?: (
    this: LifecycleBindContextThis,
    ...args: MessageType[K] extends void ? [] : [MessageType[K]]
  ) => void;
};

export type Role<R extends RoleName, PlanName extends string | void = void> = {
  subscribes: Subscribes;
  plans: Record<
    PlanName extends void ? "prepare" : PlanName | "prepare",
    (
      this: LifecycleProcessContextThis,
      creep: Creep,
      data: CreepData<R>
    ) => void | PlanName | "prepare"
  >;
};

export type HarversterData = {
  sourceId: Source["id"];
  targetId?: ConstructionSite["id"] | StructureContainer["id"];
  startTick?: number;
  walkTick?: number;
};

export type CollectorData = {
  sourceId: StructureContainer["id"];
  targetId: StructureSpawn["id"] | StructureExtension["id"];
};

export type RoleDataMap = {
  harverster: HarversterData;
  collector: CollectorData;
  builder: HarversterData;
  repairer: HarversterData;
  upgrader: HarversterData;
};

export type CreepData<R extends RoleName = RoleName> = {
  role: R;
  room: string;
  cursor?: string;
  spawning: boolean;
} & RoleDataMap[R];

export type MemoryData = {
  creeps: Record<string, CreepData>;
};
