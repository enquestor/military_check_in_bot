// Import all dependencies, mostly using destructuring for better view.
import {
  ClientConfig,
  Client,
  middleware,
  MiddlewareConfig,
  WebhookEvent,
  MessageAPIResponseBase,
} from "@line/bot-sdk";
import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";
import { createClient } from "redis";
import { parseMessage } from "./utils";
import { Chat, Command } from "./models";
import {
  about,
  absent,
  add,
  configExample,
  configFormat,
  configIds,
  example,
  format,
  help,
  set,
  show,
} from "./mbot";
import { CommandResult } from "./models/command_result";

dotenv.config();

// Setup all LINE client and Express configurations.
const clientConfig: ClientConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.CHANNEL_SECRET,
};

const middlewareConfig: MiddlewareConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET || "",
};

const PORT = process.env.PORT || 3000;

const client = new Client(clientConfig);
const app: Application = express();

app.post(
  "/webhook",
  middleware(middlewareConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;

    // Process all of the received events asynchronously.
    const results = await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          await textEventHandler(event);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(error);
          }

          // Return an error message.
          return res.status(500).json({
            status: "error",
          });
        }
      })
    );

    // Return a successfull message.
    return res.status(200).json({
      status: "success",
      results,
    });
  }
);

const redis = createClient({
  url: process.env.REDIS_URL,
});
redis.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
  });
});

// Function handler to receive the text.
const textEventHandler = async (
  event: WebhookEvent
): Promise<MessageAPIResponseBase | undefined> => {
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const { replyToken } = event;
  const { text } = event.message;
  const source = event.source;

  let chatId = source.type === "group" ? source.groupId : source.userId!;
  let chat: Chat | undefined;
  try {
    const chatString = await redis.get(chatId);
    if (chatString) {
      chat = JSON.parse(chatString);
    }
  } catch {}

  if (!chat) {
    chat = {
      checkIns: [],
      format: "",
      example: "",
      ids: [],
    };
  }

  const commandResult = await handleMessage(chat, text);

  const tasks: Promise<any>[] = [];
  if (commandResult.chat) {
    tasks.push(redis.set(chatId, JSON.stringify(commandResult.chat)));
  }
  if (commandResult.reply) {
    tasks.push(
      client.replyMessage(replyToken, {
        type: "text",
        text: commandResult.reply,
      })
    );
  }

  await Promise.all(tasks);
};

const handleMessage = async (
  chat: Chat,
  text: string
): Promise<CommandResult> => {
  try {
    const parsedMessage = parseMessage(text);

    switch (parsedMessage.command) {
      case Command.Add:
        return add(chat, parsedMessage.message);
      case Command.Set:
        return set(chat, parsedMessage.message);
      case Command.Show:
        return show(chat);
      case Command.Absent:
        return absent(chat);
      case Command.Help:
        return help();
      case Command.About:
        return about();
      case Command.Format:
        return format(chat);
      case Command.Example:
        return example(chat);
      case Command.ConfigFormat:
        return configFormat(chat, parsedMessage.message);
      case Command.ConfigExample:
        return configExample(chat, parsedMessage.message);
      case Command.ConfigIds:
        return configIds(chat, parsedMessage.message);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { reply: error.message };
    }
  }

  return {};
};
