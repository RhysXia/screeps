export class CreepStateMachine<
  M extends { process?: (this: any) => any },
  PlanName extends string,
  Mem extends {
    action?: PlanName | "prepare";
  },
  Context = M["process"] extends (this: infer T) => any ? T : never
> {
  constructor(
    private readonly plans: Record<
      PlanName | "prepare",
      (this: Context, creep: Creep, memory: Mem) => PlanName | "prepare" | void
    >
  ) {}

  invoke(ctx: Context, creep: Creep, memory: Mem) {
    const action = memory.action || "prepare";
    const plan = this.plans[action];

    const nextAction = plan.call(ctx, creep, memory);

    if (nextAction) {
      if (nextAction !== action) {
        creep.say(nextAction);
      }

      memory.action = nextAction;
    }
  }
}
