import Letta from "@letta-ai/letta-client";

let client: Letta | null = null;

export function getLettaClient(): Letta {
  if (!client) {
    // Prefer localhost for local development when LETTA_BASE_URL is not set.
    const baseURL = process.env.LETTA_BASE_URL || 'http://localhost:8283';
    const apiKey = process.env.LETTA_API_KEY || undefined;

    if (baseURL.includes('://letta')) {
      console.warn(
        'LETTA_BASE_URL is set to a container hostname ("letta:8283"). This hostname may not be resolvable from your host machine. Set LETTA_BASE_URL=http://localhost:8283 to reach the container from your host.'
      );
    } else {
      console.log('Using Letta base URL:', baseURL);
    }

    client = new Letta({ apiKey, baseURL });
  }
  return client;
}

export default getLettaClient;
