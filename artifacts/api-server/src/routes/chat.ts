import { Router, type IRouter } from "express";
import { AgentsClient } from "@azure/ai-agents";
import type { TokenCredential } from "@azure/core-auth";
import { SendMessageBody, SendMessageResponse, CreateThreadResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getClient(): AgentsClient {
  const endpoint = process.env["AZURE_AI_PROJECT_ENDPOINT"];
  const apiKey = process.env["AZURE_AI_API_KEY"];

  if (!endpoint || !apiKey) {
    throw new Error(
      "AZURE_AI_PROJECT_ENDPOINT and AZURE_AI_API_KEY environment variables must be set",
    );
  }

  // The @azure/ai-agents SDK strips custom credentials options internally.
  // Workaround: create client with a no-op credential, then patch the pipeline
  // to remove the default Bearer-token policy and inject the api-key header.
  const noopCredential: TokenCredential = {
    getToken: async () => ({ token: "", expiresOnTimestamp: 0 }),
  };

  const client = new AgentsClient(endpoint, noopCredential);

  // Remove the bearer token auth policy added by the SDK
  client.pipeline.removePolicy({ name: "bearerTokenAuthenticationPolicy" });

  // Add our api-key header policy in the Sign phase (runs last before send)
  client.pipeline.addPolicy(
    {
      name: "azureApiKeyPolicy",
      sendRequest: (req, next) => {
        req.headers.set("api-key", apiKey);
        return next(req);
      },
    },
    { phase: "Sign" },
  );

  return client;
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

    // Create a new thread if one wasn't provided
    let threadId = body.threadId;
    if (!threadId) {
      const thread = await client.threads.create();
      threadId = thread.id;
    }

    // Add the user message to the thread
    await client.messages.create(threadId, {
      role: "user",
      content: body.message,
    });

    // Run the agent and wait for completion (polls internally)
    const run = await client.runs.createAndPoll(threadId, agentId);

    if (run.status !== "completed") {
      req.log.error({ status: run.status }, "Agent run did not complete");
      res.status(500).json({ error: `Agent run ended with status: ${run.status}` });
      return;
    }

    // Get the latest assistant message
    let reply = "";
    const messagesPage = await client.messages.list(threadId, { order: "desc" });
    for await (const msg of messagesPage) {
      if (msg.role === "assistant") {
        for (const block of msg.content) {
          if (block.type === "text") {
            reply += block.text.value;
          }
        }
        break; // only need the first (most recent) assistant message
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
