# PowerShell Command Execution Rules (powershell.md)

## 1. Syntax Enforcement & Shell Constraints

You must strictly use Windows PowerShell compatible syntax for all terminal executions. Never use Bash-style logical operators like `&&` or `||`, as they are not supported by the PowerShell parser and will cause immediate runtime errors.

- **Forbidden Operator:** `&&` (causes `The token '&&' is not a valid statement separator` error)
- **Mandatory Replacement:** `;` (Semicolon) to chain commands sequentially regardless of the previous command's success.

## 2. Command Chaining Standards

When staging files, committing, or running scripts in sequence, you must use the following patterns:

### Git Operations

- **Incorrect (Bash Style):**

  ```bash
  git add . && git commit -m "feat: design auth layout"
  ```

  - **Correct (PowerShell Style):**

  ```bash
  git add .; git commit -m "feat: design auth layout"
  ```

### Build & Verification Pipelines

- **Incorrect (Bash Style):**

```bash
pnpm run lint && pnpm run build

```

- **Correct (PowerShell Style):**

```powershell
pnpm run lint; pnpm run build

```

## 3. Error Recovery & Automation Protocol

If a command fails or throws a parser exception due to accidental shell syntax mismatches:

1. **Stop execution immediately.** Do not attempt a retry using the same operator.
2. Rewrite the statement using standard PowerShell syntax by splitting commands onto separate lines or using semicolons.
3. Verify that the current command execution model aligns with Windows terminal limitations before transmitting to the shell.
4. never execute `pnpm run dev.`

```

```
