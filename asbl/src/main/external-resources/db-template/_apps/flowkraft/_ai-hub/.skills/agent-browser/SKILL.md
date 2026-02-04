---
name: agent-browser
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, or extract information from web pages.
---

# Browser Automation Skill (agent-browser)

This skill provides **full browser automation** via the `agent-browser` CLI tool.

**Documentation:** https://agent-browser.dev | **GitHub:** https://github.com/vercel-labs/agent-browser

---

## When to Use This Skill

Use agent-browser when you need to:

- Navigate websites interactively
- Click buttons and links
- Fill forms
- Take screenshots or PDFs
- Extract data from pages
- Explore unknown UIs step by step
- Perform lightweight browser automation

---

## Mandatory Session Workflow

For EVERY agent-browser session:

1. **GENERATE** a random `<sessionId>` (e.g., `abc123`)
2. **START** with `agent-browser --session <sessionId> open <url>`
3. **ALL** subsequent commands must include `--session <sessionId>`
4. **CLEANUP (REQUIRED):** Every session MUST end with `agent-browser --session <sessionId> close`

⚠️ **Never leave browser sessions open** — always close them to prevent resource leaks.

---

## Core Workflow Examples

### Step 1 — Open a page (Start Session)

```bash
agent-browser --session abc123 open https://example.com
```

---

### Step 2 — Snapshot the page

```bash
agent-browser --session abc123 snapshot -i
```

This returns **interactive elements with references**:

```
textbox "Email"        [ref=e1]
textbox "Password"     [ref=e2]
button  "Submit"       [ref=e3]
```

---

### Step 3 — Interact using refs

```bash
agent-browser --session abc123 fill @e1 "user@example.com"
agent-browser --session abc123 fill @e2 "password123"
agent-browser --session abc123 click @e3
```

---

### Step 4 — Re-snapshot after navigation

```bash
agent-browser --session abc123 snapshot -i
```

---

### Step 5 — Close Session (REQUIRED)

```bash
agent-browser --session abc123 close
```

---

## Navigation Commands

```bash
agent-browser --session <sessionId> open <url>
agent-browser --session <sessionId> back
agent-browser --session <sessionId> forward
agent-browser --session <sessionId> reload
agent-browser --session <sessionId> close
```

---

## Snapshot (Page Analysis)

```bash
agent-browser --session <sessionId> snapshot
agent-browser --session <sessionId> snapshot -i          # Interactive elements only
agent-browser --session <sessionId> snapshot -c          # Compact output
agent-browser --session <sessionId> snapshot -d 3        # Depth limit
agent-browser --session <sessionId> snapshot -s "#main"  # Scope to selector
```

---

## Interactions (Using Refs from Snapshot)

```bash
agent-browser --session <sessionId> click @e1
agent-browser --session <sessionId> dblclick @e1
agent-browser --session <sessionId> hover @e1
agent-browser --session <sessionId> focus @e1
agent-browser --session <sessionId> fill @e2 "text"
agent-browser --session <sessionId> type @e2 "text"
agent-browser --session <sessionId> press Enter
agent-browser --session <sessionId> check @e1
agent-browser --session <sessionId> uncheck @e1
agent-browser --session <sessionId> select @e1 "value"
agent-browser --session <sessionId> scroll down 500
agent-browser --session <sessionId> scrollintoview @e1
agent-browser --session <sessionId> drag @e1 @e2
agent-browser --session <sessionId> upload @e1 file.pdf
```

---

## Getting Information

```bash
agent-browser --session <sessionId> get text @e1
agent-browser --session <sessionId> get html @e1
agent-browser --session <sessionId> get value @e1
agent-browser --session <sessionId> get attr @e1 href
agent-browser --session <sessionId> get title
agent-browser --session <sessionId> get url
agent-browser --session <sessionId> get count ".item"
```

---

## Screenshots & PDFs

```bash
agent-browser --session <sessionId> screenshot
agent-browser --session <sessionId> screenshot page.png
agent-browser --session <sessionId> screenshot --full
agent-browser --session <sessionId> pdf output.pdf
```

---

## Waiting

```bash
agent-browser --session <sessionId> wait @e1
agent-browser --session <sessionId> wait 2000
agent-browser --session <sessionId> wait --text "Success"
agent-browser --session <sessionId> wait --url "**/dashboard"
agent-browser --session <sessionId> wait --load networkidle
```

---

## Complete Example: Form Submission

```bash
# Start session
agent-browser --session myform open https://example.com/form

# Analyze the page
agent-browser --session myform snapshot -i

# Fill and submit
agent-browser --session myform fill @e1 "user@example.com"
agent-browser --session myform fill @e2 "password123"
agent-browser --session myform click @e3

# Wait for navigation and re-analyze
agent-browser --session myform wait --load networkidle
agent-browser --session myform snapshot -i

# ALWAYS close the session
agent-browser --session myform close
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Open URL | `agent-browser --session ID open URL` |
| Get page structure | `agent-browser --session ID snapshot -i` |
| Click element | `agent-browser --session ID click @ref` |
| Fill input | `agent-browser --session ID fill @ref "text"` |
| Take screenshot | `agent-browser --session ID screenshot file.png` |
| Close session | `agent-browser --session ID close` |

---

## My Principle

> **Explore → Snapshot → Interact → Close.** Always use snapshots to understand the page structure before interacting. Always close sessions when done. Keep automation interactive and incremental.
