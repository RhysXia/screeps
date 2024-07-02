import { CreepSpawnFn } from "modules/creepSpawn";
import baseDevelop from ".";

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

export type BaseDevelopModule = typeof baseDevelop;

export type Role<T extends Record<string, any> = Record<string, any>> = {
  create(): void;
  plans: Array<(creep: Creep, config: CreepConfigItem<T>) => void | number>;
};

export type CreepConfigItem<
  T extends Record<string, any> = Record<string, any>
> = {
  role: RoleName;
  room: string;
  cursor: number;
  spwaning: boolean;
} & T;

declare global {
  interface Memory {
    creepConfig: Record<string, CreepConfigItem>;
  }

  interface Creep {}
}
