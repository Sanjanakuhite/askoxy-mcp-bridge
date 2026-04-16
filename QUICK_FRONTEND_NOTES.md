# Frontend changes

## 1) Token URL
Change frontend token base URL to Node:
```ts
const DEFAULT_BASE_URL = "http://localhost:3001";
```

## 2) Attach MCP in session.update
```ts
sendEvent({
  type: "session.update",
  session: {
    type: "realtime",
    instructions: finalInstruction,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: finalLanguageCode,
          prompt: transcriptionInstruction,
        },
        turn_detection: {
          type: "server_vad",
          silence_duration_ms: 900,
        },
      },
      output: {
        voice: "alloy",
      },
    },
    tools: [
      {
        type: "mcp",
        server_label: "askoxy_mcp",
        server_url: "http://localhost:3001/mcp",
        require_approval: "never",
      },
    ],
  },
});
```

## 3) Remove from UI
Remove hardcoded intent resolution from React UI.
Remove direct backend voice-action API call from UI.
UI should only:
- start session
- show transcripts/status
- let AI choose MCP tool
- redirect only if grounded result contains `redirectPage`
