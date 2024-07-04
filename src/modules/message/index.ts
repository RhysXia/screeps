import { warning } from "core/logger";
import { defineScreepModule } from "core/module";

export type MessageModuleExport = {
  binding: {
    publish(message: string, params?: any, isGlobal?: boolean): void;
    subsribe(message, fn: (params?: any) => void, isGlobal?: boolean): void;
  };
};

export const moduleName = "message";

const fnMap = new Map<string, Map<string, Set<(params: any) => void>>>();

const globalFnMap = new Map<string, Set<(params: any) => void>>();

const messages: Array<{
  message: string;
  params?: any;
  room?: string;
}> = [];

export default defineScreepModule<{}, MessageModuleExport>({
  name: moduleName,
  binding() {
    return {
      subsribe(message, fn, isGlobal) {
        let map: Map<string, Set<(params: any) => void>>;

        if (isGlobal) {
          map = globalFnMap;
        } else {
          map = fnMap.get(this.targetModuleName) || new Map();
          fnMap.set(this.targetModuleName, map);
        }

        const set = map.get(message) || new Set();

        set.add(fn);

        map.set(message, set);
      },
      publish(message, params, isGlobal) {
        messages.push({
          message: message,
          params: params,
          room: isGlobal ? undefined : this.targetModuleName,
        });
      },
    };
  },
  postProcess() {
    while (true) {
      const messageInfo = messages.pop();
      if (!messageInfo) {
        break;
      }

      const { message, room, params } = messageInfo;

      const set = (room ? fnMap.get(room) : globalFnMap).get(message);

      if (!set || !set.size) {
        warning(`no suscriber for message(${message})`);
        continue;
      }

      set.forEach((it) => {
        it(params);
      });
    }
  },
});
