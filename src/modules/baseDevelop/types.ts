import { CreepTaskAddTask } from "modules/creepTask";
import baseDevelop from ".";

export enum RoleName {
  /**
   * 采集者
   */
  HARVERSTER,
  /**
   * 收集者
   */
  COLLECTOR,
  /**
   * 升级者
   */
  UPGRADER,
  /**
   * 建造者
   */
  BUILDER,
  /**
   * 维修着
   */
  REPAIRER,
}

export type BaseDevelopModule = typeof baseDevelop;

export type Role<T extends Record<string, any> = Record<string, any>> = {
  create(createCreep: CreepTaskAddTask): void;
  prepare?(creep: Creep, config: CreepConfigItem<T>): boolean;
  plans: Array<(creep: Creep, config: CreepConfigItem<T>) => void | number>;
};

export type CreepConfigItem<
  T extends Record<string, any> = Record<string, any>
> = {
  role: RoleName;
  room: string;
  cursor?: number;
} & T;

declare global {
  interface CreepMemory {
    role: RoleName;
  }

  interface Memory {
    creepConfig: Record<string, CreepConfigItem>;
  }

  interface Creep {}
}
