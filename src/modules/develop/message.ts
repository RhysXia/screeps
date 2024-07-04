import { Message } from "common/message";
import { CreepData } from "./types";

export type MessageType = {
  moduleInit: void;
  onSpawn: {
    name: string;
    code: ScreepsReturnCode;
  };
  spawn: Omit<CreepData, "cursor" | "spawning">;
  reSpawn: string;
};

const message = new Message<MessageType>();

export default message;
