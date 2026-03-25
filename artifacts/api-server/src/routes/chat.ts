import { Router, type IRouter } from "express";
import { AIProjectClient } from "@azure/ai-projects";
import { AzureKeyCredential } from "@azure/core-auth";
import { SendMessageBody, SendMessageResponse, CreateThreadResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getClient() {
  const endpoint = process.env["AZURE_AI_PROJECT_ENDPOINT"];
  const apiKey = process.env["AZURE_AI_API_KEY"];

  if (!endpoint || !apiKey) {
    throw new Error(
      "AZURE_AI_PROJECT_ENDPOINT and AZURE_AI_API_KEY environment variables must be set",
    );
  }

  return AIProjectClient.fromEndpoint(endpoint, new AzureKeyCredential(apiKey));
}

function getAgentId() {
  const agentId = process.env["AZURE_AI_AGENT_ID"];
  if (!agentId) {
    throw new Error("AZURE_AI_AGENT_ID environment variable must be set");
  }
  return agentId;
}

router.post("/chat/threads", async (req, res) => {
  try {
    const client = getClient();
    const thread = await client.agents.threads.create();
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

    let threadId = body.threadId;
    if (!threadId) {
      const thread = await client.agents.threads.create();
      threadId = thread.id;
    }

    await client.agents.messages.create(threadId, {
      role: "user",
      content: body.message,
    });

    const run = await client.agents.runs.createAndPoll(threadId, {
      assistantId: agentId,
    });

    if (run.status !== "completed") {
      req.log.error({ status: run.status }, "Agent run did not complete");
      res.status(500).json({ error: `Agent run ended with status: ${run.status}` });
      return;
    }

    const messages = await client.agents.messages.list(threadId, { order: "desc", limit: 1 });
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
