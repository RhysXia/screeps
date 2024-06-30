import { LoDashStatic } from "lodash";

declare global {
  const _: LoDashStatic;

  interface Memory {
    isInited?: boolean;
  }
}
