# Token & Cost Control Rules (limittoken.md)

## 1. Absolute API Constraints & Model Enforcement (Gemini Free Tier)

- **Model Enforcement:** You must strictly and exclusively use **`gemini-2.5-flash`** for all requests. Never downgrade, fall back, or change the model string to `gemini-1.5-flash` or any other deprecated versions, as they will cause `404 Not Found` API errors.
- **Max Tokens Per Minute (TPM):** 250,000 tokens (Input + Output combined).
- **Max Requests Per Minute (RPM):** 15 requests.
- **Max Requests Per Day (RPD):** 1,500 requests.

## 2. Token-Saving Operation Protocol (Mandatory)

### A. Context Minimization

- **Strictly No @Workspace Scan:** Never search or read the entire codebase unless explicitly ordered.
- **Selective Reading:** Only read the specific file requested (e.g., `@TopUp.jsx`). If you need to check a utility or a type, read _only_ that specific file or snippet.
- **Compact Editing:** When modifying code, use targeted edits (diffs) or rewrite only the specific function/component. Do not rewrite a whole 300-line file just to change 5 lines of code.

### B. Communication Efficiency

- **Be Concise:** Explain your logic in a maximum of 1–2 short sentences before executing. Do not write long theoretical explanations.
- **No Chatty Responses:** Do not output generic greetings, summaries of what you just did, or long "Next Steps" lists unless asked. Focus 100% on the code.

### C. Looping & Rate Limit Prevention

- **Loop Interruption:** If you encounter a compilation/lint error and your first fix fails, **DO NOT** attempt a third automated fix immediately. Stop execution, report the error to the user, and ask for guidance to prevent burning the 15 RPM limit.
- **Verification Throttle:** Only run terminal commands (like `npm run build` or `pnpm run lint`) after a significant milestone is reached, not after every single minor file edit.

## 3. Threshold Warnings & Session Management

- **Token Check:** If you notice the codebase context or the current chat history is getting heavy (approaching 100,000 tokens in memory), you must proactively warn the user:
  _"Current session token load is high. Please consider reviewing the current changes and clearing the chat history."_
- **Acknowledge:** Once you read this file, adapt your behavior to be as token-efficient and brief as possible.
