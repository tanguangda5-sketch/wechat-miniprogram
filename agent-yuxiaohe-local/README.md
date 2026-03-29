# agent-yuxiaohe-local

Local development workspace for the CloudBase code-based Agent used by "问小禾".

## Quick start

1. Copy `.env.example` to `.env` and fill required values.
2. Install dependencies:

```bash
npm install
```

3. Start the local service:

```bash
npm run start
```

The service listens on `http://localhost:9000`.

## Required env vars

- `ADP_APP_KEY`
- `TCB_ENV` or `ENV_ID`

## Important routes

- `POST /wx-send-message`
- `POST /v1/aibot/bots/:agentId/wx-send-message`
- Standard routes registered by `createExpressRoutes(...)`
