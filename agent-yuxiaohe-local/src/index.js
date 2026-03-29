import express from "express";
import { createExpressRoutes } from "@cloudbase/agent-server";
import { AdpAgent } from "@cloudbase/agent-adapter-adp";
import dotenvx from "@dotenvx/dotenvx";
import { Observable } from "rxjs";
import {
  WeChatAgent,
  createWxMessageHandler,
  WeChatHistoryManager,
} from "@cloudbase/agent-adapter-wx";
import { DetectCloudbaseUserMiddleware } from "./utils.js";

dotenvx.config();

const PORT = Number(process.env.PORT || 9000);

class MyAgent extends AdpAgent {
  generateRequestBody({ message, fileInfos, input }) {
    const req = super.generateRequestBody({
      message,
      fileInfos,
      input,
    });

    return req;
  }

  run(input) {
    const original$ = super.run(input);

    return new Observable((subscriber) => {
      const subscription = original$.subscribe({
        next: (event) => {
          subscriber.next(event);

          if (event?.type === "TEXT_MESSAGE_CHUNK") {
            subscriber.next({
              ...event,
              type: "TEXT_MESSAGE_CONTENT",
              delta: event.delta || event.content || "",
            });
          }

          if (event?.type === "RUN_FINISHED") {
            subscriber.next({
              type: "TEXT_MESSAGE_END",
            });
          }
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });

      return () => subscription.unsubscribe();
    });
  }
}

class PatchedWeChatAgent extends WeChatAgent {
  constructor(config) {
    super(config);
    this.finalReplyCache = "";
  }

  handleWeChatSending(event, input) {
    if (event?.type === "TEXT_MESSAGE_CHUNK") {
      this.messageBuffer += event.delta || event.content || "";
    } else if (event?.type === "RUN_FINISHED") {
      this.lastReply = this.messageBuffer.trim();
      if (this.lastReply) {
        this.finalReplyCache = this.lastReply;
        this.sendToWeChat(this.lastReply, input).catch(console.error);
        this.messageBuffer = "";
      }
    } else {
      super.handleWeChatSending(event, input);
    }
  }

  async sendToWeChat(content, input) {
    if (content) {
      this.finalReplyCache = content;
    }
    return super.sendToWeChat(content, input);
  }

  run(input) {
    const original$ = super.run(input);

    return new Observable((subscriber) => {
      const subscription = original$.subscribe({
        next: (event) => subscriber.next(event),
        error: (error) => subscriber.error(error),
        complete: () => {
          if (!this.lastReply && this.finalReplyCache) {
            this.lastReply = this.finalReplyCache;
          }
          subscriber.complete();
        },
      });

      return () => subscription.unsubscribe();
    });
  }
}

function createAgent({ request }) {
  const agent = new MyAgent({
    adpConfig: {
      appKey: process.env.ADP_APP_KEY || "",
      credential: {
        secretId: process.env.TENCENTCLOUD_SECRETID || "",
        secretKey: process.env.TENCENTCLOUD_SECRETKEY || "",
        token: process.env.TENCENTCLOUD_SESSIONTOKEN || "",
      },
      enableUpload: false,
    },
  });

  agent.use(new DetectCloudbaseUserMiddleware(request));

  return agent;
}

function createWxAgent({ request, options }) {
  const baseAgent = createAgent({ request });
  const envId = process.env.TCB_ENV || process.env.ENV_ID || "";
  const authorization =
    request.headers.authorization ||
    request.headers.Authorization ||
    request.headers.get?.("authorization") ||
    request.headers.get?.("Authorization") ||
    "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  return {
    agent: new PatchedWeChatAgent({
      agentId: options?.agentId || process.env.AGENT_ID || "agent-yuxiaohe",
      agent: baseAgent,
      wechatConfig: {
        sendMode: "aitools",
        context: {
          extendedContext: {
            envId,
            accessToken,
          },
        },
      },
      historyManager: new WeChatHistoryManager({
        envId,
      }),
    }),
  };
}


const app = express();

createExpressRoutes({
  createAgent,
  express: app,
});

app.post(
  "/wx-send-message",
  express.json(),
  createWxMessageHandler(createWxAgent)
);

app.post(
  "/v1/aibot/bots/:agentId/wx-send-message",
  express.json(),
  createWxMessageHandler(createWxAgent)
);

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}!`);
});
