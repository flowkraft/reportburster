import chainlit as cl
import vanna as vn
import pandas as pd
from db_connector import connect_from_env
from llm_connector import initialize_vanna

@cl.on_chat_start
async def on_chat_start():
    """
    Initializes Vanna and the database connection when a new chat starts.
    """
    try:
        # Step 1: Initialize the Vanna LLM backend using the llm_connector
        initialize_vanna()
        
        # Step 2: Connect to the source database using the db_connector
        connect_from_env()
        
        # Get the database model name (e.g., "chinook_sqlite") set by the db_connector
        model_name = vn.get_model() 
        await cl.Message(content=f"Connected to database model: `{model_name}`. How can I help you?").send()

    except Exception as e:
        await cl.Message(content=f"Error during initialization: {e}").send()
        return

    # Store the main processing function in the user session for later use
    cl.user_session.set("run_vanna_chain", run_vanna_chain)


@cl.on_message
async def on_message(message: cl.Message):
    """
    Handles incoming user messages by calling the main processing function.
    """
    run_vanna_chain = cl.user_session.get("run_vanna_chain")
    await run_vanna_chain(message)


async def run_vanna_chain(message: cl.Message):
    """
    The main logic chain for processing a user query with Vanna.
    """
    human_query = message.content
    
    # Create a message placeholder that will be updated as the chain progresses
    msg = cl.Message(content="")
    await msg.send()

    # Step 1: Generate SQL query
    async with cl.Step(name="Generate SQL") as sql_step:
        sql_query = vn.generate_sql(human_query)
        if sql_query:
            sql_step.output = f"```sql\n{sql_query}\n```"
        else:
            sql_step.is_error = True
            sql_step.output = "Failed to generate SQL query."
            msg.content = "I couldn't generate an SQL query for your request. Please try rephrasing it."
            await msg.update()
            return

    # Step 2: Execute the SQL query
    async with cl.Step(name="Execute Query") as exec_step:
        try:
            df = vn.run_sql(sql_query)
            exec_step.output = df.head().to_markdown(index=False)
        except Exception as e:
            exec_step.is_error = True
            exec_step.output = f"Error executing query: {e}"
            msg.content = "I encountered an error while running the SQL query. Please check the generated SQL."
            await msg.update()
            return

    # Step 3: Generate a Plotly chart
    async with cl.Step(name="Generate Plot") as plot_step:
        try:
            plotly_code = vn.generate_plotly_code(question=human_query, sql=sql_query, df=df)
            if plotly_code:
                plot_step.output = f"```python\n{plotly_code}\n```"
                fig = vn.get_plotly_figure(plotly_code=plotly_code, df=df)
                msg.elements = [cl.Plotly(name="chart", figure=fig, display="inline")]
            else:
                plot_step.output = "Could not generate a plot for this query."
        except Exception as e:
            plot_step.output = f"Could not generate plot: {e}"

    # Finalize the message to the user
    msg.content = f"Here is the result for your query: '{human_query}'"
    await msg.update()