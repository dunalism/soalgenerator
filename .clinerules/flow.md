# 🧠 STRICT EXECUTION WORKFLOW (THE "PLAN-FIRST" RULE)

You are an AI assistant (Cline). To prevent errors, wasted tokens, and architectural mistakes, you MUST strictly follow this workflow for EVERY new feature, bug fix, or task requested by the user.

**🛑 CRITICAL: DO NOT WRITE OR MODIFY ANY EXECUTABLE CODE BEFORE COMPLETING THIS WORKFLOW AND GETTING EXPLICIT USER APPROVAL.**

## WORKFLOW STAGES:

### Stage 1: PROMPTING & UNDERSTANDING

- Receive the prompt/instruction from the user.
- Read and analyze the requirements. If anything is ambiguous, ASK for clarification before proceeding to Stage 2.

### Stage 2: PLANNING (MANDATORY)

- You MUST create a detailed Markdown planning file before writing any actual application code.
- **Directory:** Save the file inside the `planning/` directory at the root of the workspace. (Create the directory if it does not exist).
- **Naming Convention:** Name the file based on the specific feature or task, using kebab-case (e.g., `planning/google-auth-integration.md`, `planning/ui-assessment-card.md`).
- **Required Content in the Planning File:**
  1. **Objective:** A concise summary of the task. All planning explanation in Indonesian.
  2. **Affected Files:** A checklist of exact file paths that will be created or modified.
  3. **Implementation Steps:** Step-by-step logic, including components, API routes, SQL/Prisma operations, and UI/UX flow.
  4. **Dependencies:** Any new packages that need to be installed.
  5. **Edge Cases/Error Handling:** How you plan to handle potential failures (e.g., empty inputs, API timeouts).

### Stage 3: USER REVIEW (PAUSE POINT)

- After saving the planning file, you MUST **STOP** all automated actions.
- Notify the user with this exact message format:
  _"✅ Planning file created at `planning/[filename].md`. Please review it. Shall I execute this plan, or do we need to revise it?"_
- **WAIT FOR EXPLICIT USER APPROVAL.**

### Stage 4: EXECUTION OR REVISION

- **If User Approves (e.g., "lanjut", "eksekusi", "ok"):** Execute the code strictly adhering to the approved plan in the markdown file. Do not deviate from the plan without asking first.
- **If User Rejects or Requests Changes:** DO NOT write application code. Update the planning file based on the user's feedback, save it, and return to Stage 3 to ask for approval again.

### Stage 5: VERIFICATION & MANDATORY COMMIT

- Once execution is complete, you MUST verify the changes by asking the user to run a build or lint command (e.g., `npm run build` or `pnpm run build`) to ensure zero errors. Only run theese commands after a significant milestone is reached, not after every single minor file edit (i use pnpm).
- **MANDATORY:** After successful verification, you **MUST explicitly execute the Git commit command** via the terminal.
- Use the industry-standard **Conventional Commits** format for the message:
  - `feat: ...` for new features.
  - `fix: ...` for bug fixes.
  - `docs: ...` for documentation changes.
  - `style: ...` for formatting/styles without changing logic.
  - `refactor: ...` for code changes that neither fix bugs nor add features.
- Example execution: `git add . && git commit -m "feat: add user authentication layout"`
- Notify the user once the commit is successfully executed.
