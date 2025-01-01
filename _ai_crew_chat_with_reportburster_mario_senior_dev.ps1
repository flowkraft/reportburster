# Activate the Python virtual environment
& ../../../.chezmoi/.venv-aider/Scripts/Activate.ps1

# Run aider

# Claude Sonnet by default (the BEST quality but expensive)
# aider --max-chat-history-tokens 8192

# OpenAI
#aider --4o --max-chat-history-tokens 8192

# deepseek v3
aider --model openrouter/deepseek/deepseek-chat --config .workspace-mario/.aider-mario.conf.yml --watch-files --input-history-file .workspace-mario/.aider-mario.input.history --chat-history-file .workspace-mario/.aider-mario.chat.history.md --aiderignore .aiderignore-mario

# Claude Haiku
# aider --model openrouter/anthropic/claude-3-5-haiku-20241022 

# Claude Sonnet
# aider --model openrouter/anthropic/claude-3.5-sonnet 

# Virgil: for me caching seems to increase costs much more because I see lots 
# of "write cache" for thousands of tokens each but almost no "cache hits" 
# (or very few)

# aider --cache-prompts --no-stream