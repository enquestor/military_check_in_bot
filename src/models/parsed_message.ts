import { Command } from "./command";

export interface ParsedMessage {
  command?: Command | undefined;
  message: string;
}
