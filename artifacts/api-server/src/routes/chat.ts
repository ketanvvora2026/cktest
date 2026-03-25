import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { SendMessageBody, SendMessageResponse, CreateThreadResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getClient(): OpenAI {
  const servicesEndpoint = process.env["AZURE_AI_SERVICES_ENDPOINT"];
  const apiKey = process.env["AZURE_AI_API_KEY"];

  if (!servicesEndpoint || !apiKey) {
    throw new Error(
      "AZURE_AI_SERVICES_ENDPOINT and AZURE_AI_API_KEY environment variables must be set",
    );
  }

  const baseURL = servicesEndpoint.replace(/\/$/, "") + "/openai";

  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: { "api-key": apiKey },
    defaultQuery: { "api-version": "2024-05-01-preview" },
  });
}

function getAgentId(): string {
  const agentId = process.env["AZURE_AI_AGENT_ID"];
  if (!agentId) {
    throw new Error("AZURE_AI_AGENT_ID environment variable must be set");
  }
  return agentId;
}

router.post("/chat/threads", async (req, res) => {
  try {
    const client = getClient();
    const thread = await client.beta.threads.create();
    const data = CreateThreadResponse.parse({ threadId: thread.id });
    res.json(data);
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to create thread");
    const message = err instanceof Error ? err.message : "Failed to create thread";
    res.status(500).json({ error: message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const body = SendMessageBody.parse(req.body);
    const client = getClient();
    const agentId = getAgentId();

    // Create a new thread if one wasn't provided
    let threadId = body.threadId;
    if (!threadId) {
      const thread = await client.beta.threads.create();
      threadId = thread.id;
    }

    // Add the user message to the thread
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: body.message,
    });

    // Run the agent and poll until completion
    const run = await client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: agentId,
    });

    if (run.status !== "completed") {
      req.log.error({ status: run.status }, "Agent run did not complete");
      res.status(500).json({ error: `Agent run ended with status: ${run.status}` });
      return;
    }

    // Get the latest assistant message
    const messages = await client.beta.threads.messages.list(threadId, {
      order: "desc",
      limit: 1,
    });

    const lastMessage = messages.data[0];
    let reply = "";

    if (lastMessage && lastMessage.role === "assistant") {
      for (const block of lastMessage.content) {
        if (block.type === "text") {
          reply += block.text.value;
        }
      }
    }

    const data = SendMessageResponse.parse({ reply, threadId });
    res.json(data);
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to send message");
    const message = err instanceof Error ? err.message : "Failed to send message";
    res.status(500).json({ error: message });
  }
});

export default router;
