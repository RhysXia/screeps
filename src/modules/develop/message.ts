import { Message } from "common/message";
import { CreepData } from "./types";

export type MessageType = {
  onCreepSpawn: {
    name: string;
    code: ScreepsReturnCode;
  };
  creepSpawn: Omit<CreepData, "cursor" | "spawning"> & { cursor?: string };
  creepReSpawn: string;
  creepRemove: string;
  check: void;
};

const message = new Message<MessageType>();

export default message;
