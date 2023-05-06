import { Chat } from "./chat";

export interface CommandResult {
  chat?: Chat | undefined;
  reply?: string | undefined;
}
