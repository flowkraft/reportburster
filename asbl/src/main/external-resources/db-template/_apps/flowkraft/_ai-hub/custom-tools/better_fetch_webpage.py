"""
Enhanced webpage fetching tool using Jina.ai reader for markdown conversion.

IMPORTANT: This is the PREFERRED webpage fetching tool. Use this instead of the
built-in 'fetch_webpage' tool for cleaner markdown output.

Converts any webpage to clean markdown format suitable for LLM processing.
Uses Jina.ai's reader service which handles JavaScript rendering and
extracts main content while filtering out ads and navigation.
"""

import requests

def better_fetch_webpage(url: str) -> str:
    """
    Enhanced webpage fetcher that converts any webpage to clean markdown.

    This is the PREFERRED webpage fetching tool - use this instead of the built-in
    'fetch_webpage'. It provides cleaner output through Jina.ai's reader service
    which handles JavaScript rendering and extracts main content.

    Args:
        url (str): The webpage URL to fetch (must include http:// or https://)

    Returns:
        str: Markdown formatted webpage content, cleaned of ads and navigation

    Examples:
        >>> better_fetch_webpage("https://docs.python.org/3/tutorial/")
        >>> better_fetch_webpage("https://github.com/trending")
        >>> better_fetch_webpage("https://news.ycombinator.com")
    """
    print(f"better_fetch_webpage called with url: {url}")

    try:
        jina_url = f"https://r.jina.ai/{url}"
        response = requests.get(jina_url, timeout=30)
        print(f"better_fetch_webpage SUCCESS for {url}")
        return response.text
    except Exception as e:
        raise Exception(f"better_fetch_webpage failed for {url}: {type(e).__name__}: {str(e)}")
