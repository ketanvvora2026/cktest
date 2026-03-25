import { Router, type IRouter } from "express";
import { AgentsClient } from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";
import { SendMessageBody, SendMessageResponse, CreateThreadResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getClient(): AgentsClient {
  const projectEndpoint = process.env["AZURE_AI_PROJECT_ENDPOINT"];

  if (!projectEndpoint) {
    throw new Error("AZURE_AI_PROJECT_ENDPOINT environment variable must be set");
  }

  // DefaultAzureCredential automatically uses:
  // - AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET env vars (dev/service principal)
  // - Managed Identity when deployed on Azure Web App (no credentials needed)
  const credential = new DefaultAzureCredential();
  return new AgentsClient(projectEndpoint, credential);
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
    const thread = await client.threads.create();
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
      const thread = await client.threads.create();
      threadId = thread.id;
    }

    await client.messages.create(threadId, "user", body.message);

    const run = await client.runs.createAndPoll(threadId, agentId);

    if (run.status !== "completed") {
      req.log.error({ status: run.status }, "Agent run did not complete");
      res.status(500).json({ error: `Agent run ended with status: ${run.status}` });
      return;
    }

    const messages = await client.messages.list(threadId);
    const allMessages = [];
    for await (const msg of messages) {
      allMessages.push(msg);
    }

    const lastAssistantMsg = allMessages.find((m) => m.role === "assistant");
    let reply = "";

    if (lastAssistantMsg) {
      for (const block of lastAssistantMsg.content) {
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
