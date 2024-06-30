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

export type Role = {
  prepare?(creep: Creep): boolean;
  source?(creep: Creep): boolean;
  target?(creep): boolean;
};

declare global {
  interface CreepMemory {
    role: RoleName;
  }

  interface Memory {
    creepConfig: Record<
      string,
      {
        role: RoleName;
        room: string;
        ready?: boolean;
        sourceId: Source["id"] | Structure["id"];
        targetId?: Structure["id"];
        isTarget?: boolean;
      }
    >;
  }

  interface Creep {}
}
