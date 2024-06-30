import { EnhancedCreep } from "./EnhancedCreep";

export enum Role {
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

export type RoleWork = (creep: EnhancedCreep) => void;

declare global {
  interface CreepMemory {
    role: Role;
  }

  interface Memory {
    creepConfig: Record<string, {
        role: Role
        room: string
    }>
  }

  interface Creep {}
}
