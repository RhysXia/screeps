export const ALL_BODIES: Array<BodyPartConstant> = [
  MOVE,
  CARRY,
  WORK,
  ATTACK,
  RANGED_ATTACK,
  TOUGH,
  HEAL,
  CLAIM,
];

declare global {
  interface Memory {
    creepTasks: Array<{
      /**
       * name
       */
      n: string;
      /**
       * room
       */
      r: string;

      b: Array<number>;
    }>;
  }
}
