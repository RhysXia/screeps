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

export type Role<T extends Record<string, any>> = {
  checkAndCreate?(): void;
  plans: Array<(creep: Creep, data: CreepData<T>) => void | number>;
};

export type CreepData<T extends Record<string, any> = Record<string, any>> = {
  role: RoleName;
  room: string;
  cursor: number;
  spwaning: boolean;
} & T;

export type MemoryData = {
  creeps: Record<string, CreepData>
}