declare global {
  interface Memory {
    creepTasks: Array<{
      name: string;
      room: string;
      bodies: Array<BodyPartConstant>;
    }>;
  }
}

export {};
