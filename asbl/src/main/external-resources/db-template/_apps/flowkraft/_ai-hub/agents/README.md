# Agent Office Folders

This directory contains personal workspace folders for each FlowKraft AI Crew agent.

## Purpose

Agent offices are **personal workspaces** where agents store:
- Reference materials and patterns
- Personal notes and knowledge
- Agent-specific documentation
- Temporary working files

## Folder Structure

```
agents/
├── office-athena/       # Athena's workspace
├── office-hephaestus/   # Hephaestus's workspace
├── office-hermes/       # Hermes's workspace
└── office-apollo/       # Apollo's workspace
```

## Access Patterns

| Agent | Read Access | Write Access |
|-------|------------|--------------|
| Athena | All offices (`/agents-hq/`) | Own office only (`/agents-hq/office-athena/`) |
| Hephaestus | Own office only | Own office only (`/agents-hq/office-hephaestus/`) |
| Hermes | Own office only | Own office only (`/agents-hq/office-hermes/`) |
| Apollo | Own office only | Own office only (`/agents-hq/office-apollo/`) |

## Docker Mount

These folders are mounted in the Letta container as `/agents-hq/`:

```yaml
volumes:
  - ${REPORTBURSTER_INSTALLATION_FOLDER}/_apps/flowkraft/_ai-hub/agents:/agents-hq
```

## Notes

- Agent offices are **separate** from PRD documents (`/docs/product/`)
- These folders persist across container restarts
- Agents use these for their own organization, not for shared collaboration
