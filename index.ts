// Import all dependencies, mostly using destructuring for better view.
import {
  ClientConfig,
  Client,
  middleware,
  MiddlewareConfig,
  WebhookEvent,
  TextMessage,
  MessageAPIResponseBase,
} from "@line/bot-sdk";
import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";

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

// Create a new LINE SDK client.
const client = new Client(clientConfig);

// Create a new Express application.
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

// Create a server and listen to it.
app.listen(PORT, () => {
  console.log(`Application is live and listening on port ${PORT}`);
});

let lastMessage = "";

const getId = (message: string) => {
  const regex = /^.*學號.*?(\d+).*$/gm;
  const match = regex.exec(message);
  if (!match) {
    throw new Error("訊息中無有效學號");
  }
  return match[1];
};

const concatenate = (main: string, added: string) => {
  const signIns = main.split(/\n{2,}/g);
  const ids = signIns.map((signIn) => getId(signIn));
  const newId = getId(added);

  if (ids.includes(newId)) {
    throw new Error("學號重複");
  }

  // insert the new id to the correct position
  let index = 0;
  while (index < ids.length && ids[index] < newId) {
    index++;
  }

  signIns.splice(index, 0, added);
  return signIns.join("\n\n");
};

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

  let chatId = source.type === "group" ? source.groupId : source.userId;

  if (text.startsWith("++")) {
    const added = text.substring(2).trim();

    try {
      const result = concatenate(lastMessage, added);
      lastMessage = result;

      await client.replyMessage(replyToken, {
        type: "text",
        text: result,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        await client.replyMessage(replyToken, {
          type: "text",
          text: `錯誤：${error.message}`,
        });
      }
    }
  } else {
    lastMessage = text;
  }
};
