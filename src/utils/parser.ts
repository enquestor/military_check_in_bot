import { CheckIn, Command, ParsedMessage } from "../models";

export function parseMessage(message: string): ParsedMessage {
  // parse quick command
  if (message.length >= 2) {
    const commandString = message.substring(0, 2);
    let command: Command | undefined;

    switch (commandString) {
      case "++":
        command = Command.Add;
        break;
      case "==":
        command = Command.Set;
        break;
      case ">>":
        command = Command.Show;
        break;
      case "--":
        command = Command.Absent;
        break;
      case "@@":
        command = Command.Help;
        break;
      case "??":
        command = Command.Format;
        break;
      case "!!":
        command = Command.Example;
    }

    if (command) {
      return {
        command,
        message: message.substring(2).trim(),
      };
    }
  }

  // parse config command
  if (message.startsWith("mbot")) {
    message = message.substring(4).trim();

    const { commandString, realMessage } = parseCommandMessage(message);
    let command: Command | undefined;

    switch (commandString) {
      case "set":
        command = Command.Set;
        break;
      case "add":
        command = Command.Add;
        break;
      case "show":
        command = Command.Show;
        break;
      case "absent":
        command = Command.Absent;
        break;
      case "help":
        command = Command.Help;
        break;
      case "about":
        command = Command.About;
        break;
      case "format":
        command = Command.Format;
        break;
      case "example":
        command = Command.Example;
        break;
      case "config":
        command = Command.Config;
        break;
    }

    if (command) {
      message = realMessage;
      console.log(command, message);

      if (command === Command.Config) {
        const config = parseCommandMessage(message);

        switch (config.commandString) {
          case "format":
            return {
              command: Command.ConfigFormat,
              message: config.realMessage,
            };
          case "example":
            return {
              command: Command.ConfigExample,
              message: config.realMessage,
            };
          case "ids":
            return {
              command: Command.ConfigIds,
              message: config.realMessage,
            };
        }
      } else {
        return {
          command,
          message,
        };
      }
    } else {
      throw new Error("無效指令");
    }
  }

  return { message: "" };
}

export function parseCheckIns(arg: string): CheckIn[] {
  const unorderedCheckIns = arg
    .split(/\n{2,}/g)
    .map(
      (message): CheckIn => ({
        id: parseId(message),
        message,
      })
    )
    .filter((checkIn) => checkIn.id !== -1);

  const checkIns = unorderedCheckIns.sort((a, b) => a.id - b.id);

  return checkIns;
}

function parseId(message: string): number {
  const regex = /^.*學號.*?(\d+).*$/gm;
  const match = regex.exec(message);
  if (!match) {
    return -1;
  }
  return parseInt(match[1]);
}

function parseCommandMessage(message: string): {
  commandString: string;
  realMessage: string;
} {
  let index = message.indexOf(" ");
  index = index === -1 ? message.indexOf("\n") : index;
  index = index === -1 ? message.length : index;

  return {
    commandString: message.substring(0, index),
    realMessage: message.substring(index).trim(),
  };
}
