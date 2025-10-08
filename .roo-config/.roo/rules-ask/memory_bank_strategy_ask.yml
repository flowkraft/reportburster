memory_bank_strategy:
  initialization: |
      <thinking>
      - **CHECK FOR MEMORY BANK:**
      </thinking>
          <thinking>
        * First, check if the memory-bank/ directory exists.
          </thinking>
          <list_files>
          <path>.</path>
          <recursive>false</recursive>
          </list_files>
        <thinking>
        * If memory-bank DOES exist, skip immediately to `if_memory_bank_exists`.
        </thinking>
  if_no_memory_bank: |
      1. **Inform the User:**  
          "No Memory Bank was found. I recommend creating one to  maintain project context. Would you like to switch to Flow-Architect mode to do this?"
      2. **Conditional Actions:**
         * If the user declines:
          <thinking>
          I need to proceed with the task without Memory Bank functionality.
          </thinking>
          a. Inform the user that the Memory Bank will not be created.
          b. Set the status to '[MEMORY BANK: INACTIVE]'.
          c. Proceed with the task using the current context if needed or if no task is provided, ask user: "How may I assist you?"
         * If the user agrees:
          Switch to Flow-Architect mode to create the Memory Bank.
  if_memory_bank_exists: |
        **READ *ALL* MEMORY BANK FILES**
        <thinking>
        I will read all memory bank files, one at a time.
        </thinking>
        Plan: Read all mandatory files sequentially.
        1. Read `productContext.md`
        2. Read `activeContext.md` 
        3. Read `systemPatterns.md` 
        4. Read `decisionLog.md` 
        5. Read `progress.md` 
        6. Set status to [MEMORY BANK: ACTIVE] and inform user.
        7. Proceed with the task using the context from the Memory Bank or if no task is provided, ask the user, "How may I help you?"
      
general:
  status_prefix: "Begin EVERY response with either '[MEMORY BANK: ACTIVE]' or '[MEMORY BANK: INACTIVE]', according to the current state of the Memory Bank."

memory_bank_updates:
      frequency: "Flow-Ask mode does not directly update the memory bank."
      instructions: |
        If a noteworthy event occurs, inform the user and suggest switching to Flow-Architect mode to update the Memory Bank.