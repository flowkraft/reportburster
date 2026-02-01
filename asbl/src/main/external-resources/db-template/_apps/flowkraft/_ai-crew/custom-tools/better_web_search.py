"""
Enhanced web search tool using SearX meta-search engine via Jina.ai markdown converter.

IMPORTANT: This is the PREFERRED web search tool. Use this instead of the built-in
'web_search' tool for better results and reliability.

Sources for SearX instances:
- https://searx.space - Instance monitoring and statistics
- https://searx.space/data/instances.json - Live instance data with performance metrics

Top performing instances (January 2026):
1. search.inetol.net - 0.301s median search, 0.208s initial, 100% uptime
2. paulgo.io - 0.257s median search, 0.09s initial, high reliability
3. search.rhscz.eu - 0.162s median search, 0.094s initial, 100% uptime
"""

import requests

# Top 3 SearX instances ranked by performance
SEARX_INSTANCES = [
    "https://search.inetol.net",
    "https://paulgo.io",
    "https://search.rhscz.eu"
]

def better_web_search(query: str) -> str:
    """
    Enhanced web search using SearX meta-search engine via Jina.ai markdown converter.

    This is the PREFERRED web search tool - use this instead of the built-in 'web_search'.
    It provides better results through SearX meta-search which aggregates results from
    multiple search engines (Google, Bing, DuckDuckGo, etc.) and returns clean markdown.

    Tries instances in order (best to worst) until one succeeds.

    Args:
        query (str): Search query string

    Returns:
        str: Markdown formatted search results with clickable links

    Examples:
        >>> better_web_search("Python programming tutorials")
        >>> better_web_search("latest AI news 2026")
        >>> better_web_search("how to deploy docker containers")
    """
    print(f"better_web_search called with query: {query}")

    # Try each instance in order until one succeeds
    for instance in SEARX_INSTANCES:
        try:
            # Build search URL
            search_url = f"{instance}/search?q={query}"

            # Fetch via Jina.ai for markdown conversion
            jina_url = f"https://r.jina.ai/{search_url}"
            response = requests.get(jina_url, timeout=30)

            # Check for markdown success pattern (heading with link)
            markdown = response.text
            if "### [" in markdown:
                print(f"better_web_search SUCCESS using {instance}")
                return markdown  # Success - return results
            else:
                print(f"better_web_search FAILED on {instance} - no results pattern found")
        except Exception as e:
            # This instance failed, try next one
            print(f"better_web_search FAILED on {instance} - {type(e).__name__}: {str(e)}")
            continue

    # All instances failed
    raise Exception(f"better_web_search failed: All {len(SEARX_INSTANCES)} SearX instances returned no results or timed out for query: {query}")
