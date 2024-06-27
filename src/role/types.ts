export type RoleName =
  | "harvester" // 采集者
  | "collector" // 收集者
  | "miner" // 矿工
  | "upgrader" // 升级者
  | "builder" // 建造者
  | "repairer"; // 修理者

declare global {
  interface CreepMemory {
    role: RoleName;
  }

  interface Creep {
    //   role: AbstractRole;
  }
}
