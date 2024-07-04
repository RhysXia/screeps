import baseDevelop from ".";

type DevelopScreepModule = typeof baseDevelop;

export enum RoleName {
  /**
   * 采集者
   */
  HARVERSTER = "harverster",
  /**
   * 收集者
   */
  COLLECTOR = "collector",
  /**
   * 升级者
   */
  UPGRADER = "upgrader",
  /**
   * 建造者
   */
  BUILDER = "builder",
  /**
   * 维修着
   */
  REPAIRER = "repairer",
}

export type Messages = {
  moduleInit: void;
  onSpawn: {
    name: string;
    code: ScreepsReturnCode;
  };
  spawn: {
    room: string;
    role: RoleName;
    config: any;
  };
  reSpawn: string;
};

export type Publisher = {
  <K extends keyof Messages>(
    ...args: Messages[K] extends void ? [K] : [K, Messages[K]]
  ): void;
};

export type LifecycleBindContextThis = DevelopScreepModule["binding"] extends (
  this: infer C,
  ...args: any
) => any
  ? C & {
      publish: Publisher;
    }
  : never;

export type LifecycleProcessContextThis =
  DevelopScreepModule["binding"] extends (this: infer C, ...args: any) => any
    ? C & {
        publish: Publisher;
      }
    : never;

export type MessageRecord = {
  [K in keyof Messages]?: (
    this: LifecycleBindContextThis,
    params: Messages[K]
  ) => void;
};

export type Role<T extends Record<string, any>> = {
  messages: MessageRecord;
  plans: Array<
    (
      this: LifecycleProcessContextThis,
      creep: Creep,
      data: CreepData<T>
    ) => void | number
  >;
};

export type CreepData<T extends Record<string, any> = Record<string, any>> = {
  role: RoleName;
  room: string;
  cursor: number;
  spwaning: boolean;
} & T;

export type MemoryData = {
  creeps: Record<string, CreepData>;
};
