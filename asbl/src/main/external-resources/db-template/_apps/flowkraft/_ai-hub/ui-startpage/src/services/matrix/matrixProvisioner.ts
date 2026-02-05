/**
 * Matrix Provisioner Helper Functions
 * 
 * Provides programmatic access to Matrix/Synapse operations:
 * - Create admin users (Synapse Admin API)
 * - Create rooms (Matrix Client-Server API)
 * - Invite bots to rooms
 * - Send messages/commands to rooms
 * 
 * These functions use direct REST API calls for maximum control.
 * The matrix-js-sdk is available if more complex operations are needed.
 */

// ============================================================================
// Configuration
// ============================================================================

export interface MatrixConfig {
  /** Synapse server URL (e.g., http://localhost:8008 or http://flowkraft-ai-hub-matrix-synapse:8008) */
  homeserverUrl: string;
  /** Server name/domain (e.g., localhost or flowkraft.local) */
  serverName: string;
  /** Admin access token (from Synapse config or login) */
  adminAccessToken?: string;
  /** Shared registration secret (from homeserver.yaml) - for creating users without admin token */
  registrationSharedSecret?: string;
}

// Default config - can be overridden
let config: MatrixConfig = {
  homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://flowkraft-ai-hub-matrix-synapse:8008',
  serverName: process.env.MATRIX_SERVER_NAME || 'localhost',
  adminAccessToken: process.env.MATRIX_ADMIN_TOKEN,
  registrationSharedSecret: process.env.MATRIX_REGISTRATION_SECRET,
};

/**
 * Initialize/update the Matrix configuration
 */
export function initMatrixConfig(newConfig: Partial<MatrixConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get the current Matrix configuration
 */
export function getMatrixConfig(): MatrixConfig {
  return { ...config };
}

// ============================================================================
// Helper Types
// ============================================================================

export interface MatrixUser {
  userId: string;
  displayName?: string;
  admin?: boolean;
}

export interface MatrixRoom {
  roomId: string;
  roomAlias?: string;
  name: string;
}

export interface MatrixApiError {
  errcode: string;
  error: string;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Build a full Matrix user ID from a username
 * @example buildUserId('kraftbot') => '@kraftbot:localhost'
 */
function buildUserId(username: string): string {
  if (username.startsWith('@')) {
    return username; // Already a full user ID
  }
  return `@${username}:${config.serverName}`;
}

/**
 * Build a room alias from a name
 * @example buildRoomAlias('athena') => '#athena:localhost'
 */
function buildRoomAlias(aliasName: string): string {
  if (aliasName.startsWith('#')) {
    return aliasName; // Already a full alias
  }
  return `#${aliasName}:${config.serverName}`;
}

/**
 * Make an authenticated request to the Matrix API
 */
async function matrixFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.homeserverUrl}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (config.adminAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${config.adminAccessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as MatrixApiError;
    throw new Error(`Matrix API Error [${error.errcode}]: ${error.error}`);
  }

  return data as T;
}

// ============================================================================
// Registration with Shared Secret (Bootstrap without existing admin)
// ============================================================================

/**
 * Register a new user using Synapse's registration_shared_secret.
 * This allows creating users (including admins) on a fresh installation
 * without needing any pre-existing authentication.
 * 
 * The registration_shared_secret must be set in homeserver.yaml.
 * 
 * @param options - User registration options
 * @returns Registration result with user_id and access_token
 * 
 * @example
 * const result = await registerUserWithSharedSecret({
 *   username: 'admin',
 *   password: 'secure_password',
 *   admin: true
 * });
 * initMatrixConfig({ adminAccessToken: result.accessToken });
 */
export async function registerUserWithSharedSecret(options: {
  username: string;
  password: string;
  displayName?: string;
  admin?: boolean;
}): Promise<{
  success: boolean;
  userId: string;
  accessToken: string;
  deviceId: string;
  message: string;
}> {
  const sharedSecret = config.registrationSharedSecret;
  
  if (!sharedSecret) {
    throw new Error('registration_shared_secret not configured. Set MATRIX_REGISTRATION_SECRET env var or call initMatrixConfig()');
  }

  console.log(`[Matrix] Registering user with shared secret: ${options.username}`);

  // Step 1: Get a nonce from the server
  const nonceResponse = await fetch(`${config.homeserverUrl}/_synapse/admin/v1/register`, {
    method: 'GET',
  });
  
  if (!nonceResponse.ok) {
    throw new Error(`Failed to get registration nonce: ${await nonceResponse.text()}`);
  }
  
  const { nonce } = await nonceResponse.json() as { nonce: string };
  console.log(`[Matrix] Got registration nonce`);

  // Step 2: Generate HMAC-SHA1 MAC
  // The MAC is: HMAC-SHA1(nonce + "\x00" + username + "\x00" + password + "\x00" + admin_flag, shared_secret)
  const adminFlag = options.admin ? 'admin' : 'notadmin';
  const macData = `${nonce}\x00${options.username}\x00${options.password}\x00${adminFlag}`;
  
  // Use Node.js crypto for HMAC
  const crypto = await import('crypto');
  const mac = crypto.createHmac('sha1', sharedSecret)
    .update(macData)
    .digest('hex');

  // Step 3: Register the user
  const registerResponse = await fetch(`${config.homeserverUrl}/_synapse/admin/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nonce,
      username: options.username,
      password: options.password,
      displayname: options.displayName || options.username,
      admin: options.admin ?? false,
      mac,
    }),
  });

  if (!registerResponse.ok) {
    const error = await registerResponse.text();
    // Check if user already exists
    if (error.includes('User ID already taken') || error.includes('M_USER_IN_USE')) {
      console.log(`[Matrix] User already exists, attempting login instead`);
      // Fall back to login
      const loginResult = await loginToMatrix(options.username, options.password);
      return {
        success: true,
        userId: loginResult.userId,
        accessToken: loginResult.accessToken,
        deviceId: loginResult.deviceId,
        message: 'User already existed, logged in instead',
      };
    }
    throw new Error(`Registration failed: ${error}`);
  }

  const result = await registerResponse.json() as {
    user_id: string;
    access_token: string;
    device_id: string;
  };

  console.log(`[Matrix] ✅ User registered: ${result.user_id}`);
  
  return {
    success: true,
    userId: result.user_id,
    accessToken: result.access_token,
    deviceId: result.device_id,
    message: `User ${result.user_id} registered successfully`,
  };
}

/**
 * Bootstrap Matrix access by creating an admin user with the shared secret.
 * This is the recommended way to initialize Matrix on a fresh installation.
 * 
 * @returns The admin access token (also sets it in config)
 */
export async function bootstrapMatrixAdmin(options?: {
  username?: string;
  password?: string;
}): Promise<string> {
  const username = options?.username || 'provisioner-admin';
  const password = options?.password || `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  console.log(`[Matrix] Bootstrapping admin user: ${username}`);
  
  const result = await registerUserWithSharedSecret({
    username,
    password,
    displayName: 'Provisioner Admin',
    admin: true,
  });
  
  // Set the token in config for subsequent API calls
  initMatrixConfig({ adminAccessToken: result.accessToken });
  
  console.log(`[Matrix] ✅ Admin bootstrapped, access token configured`);
  
  return result.accessToken;
}

// ============================================================================
// 1. Create Admin User (Synapse Admin API)
// ============================================================================

export interface CreateUserOptions {
  /** Username (without @domain) */
  username: string;
  /** Password for the user */
  password: string;
  /** Display name */
  displayName?: string;
  /** Whether this user should be an admin */
  admin?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  userId: string;
  created: boolean; // false if user already existed
  message: string;
}

/**
 * Create a new user via Synapse Admin API
 * 
 * @param options - User creation options
 * @returns Result with userId and status
 * 
 * @example
 * const result = await createAdminUser({
 *   username: 'kraftbot',
 *   password: 'bot_secret_password',
 *   displayName: 'Kraftbot',
 *   admin: false
 * });
 */
export async function createAdminUser(options: CreateUserOptions): Promise<CreateUserResult> {
  const userId = buildUserId(options.username);
  
  console.log(`[Matrix] Creating user: ${userId}`);

  try {
    // Synapse Admin API: PUT /_synapse/admin/v2/users/{userId}
    // This endpoint creates the user if they don't exist, or updates if they do
    await matrixFetch(`/_synapse/admin/v2/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: options.password,
        displayname: options.displayName || options.username,
        admin: options.admin ?? false,
        deactivated: false,
      }),
    });

    console.log(`[Matrix] ✅ User created/updated: ${userId}`);
    return {
      success: true,
      userId,
      created: true,
      message: `User ${userId} created successfully`,
    };
  } catch (error) {
    const err = error as Error;
    
    // Check if user already exists (not an error for our purposes)
    if (err.message.includes('M_USER_IN_USE')) {
      console.log(`[Matrix] ℹ️ User already exists: ${userId}`);
      return {
        success: true,
        userId,
        created: false,
        message: `User ${userId} already exists`,
      };
    }

    console.error(`[Matrix] ❌ Failed to create user: ${err.message}`);
    throw error;
  }
}

// ============================================================================
// 2. Create Room (Matrix Client-Server API)
// ============================================================================

export interface CreateRoomOptions {
  /** Room name (displayed in client) */
  name: string;
  /** Room alias (e.g., 'athena' becomes #athena:localhost) */
  alias?: string;
  /** Room topic/description */
  topic?: string;
  /** Initial users to invite */
  invite?: string[];
  /** Whether the room should be public */
  isPublic?: boolean;
}

export interface CreateRoomResult {
  success: boolean;
  roomId: string;
  roomAlias?: string;
  created: boolean;
  message: string;
}

/**
 * Create a new Matrix room
 * 
 * @param options - Room creation options
 * @returns Result with roomId and status
 * 
 * @example
 * const result = await createRoom({
 *   name: 'Oracle: Athena',
 *   alias: 'athena',
 *   topic: 'Chat with Athena - Data & Analytics Oracle',
 *   invite: ['@kraftbot:localhost']
 * });
 */
export async function createRoom(options: CreateRoomOptions): Promise<CreateRoomResult> {
  const roomAlias = options.alias ? buildRoomAlias(options.alias) : undefined;
  
  console.log(`[Matrix] Creating room: ${options.name}${roomAlias ? ` (${roomAlias})` : ''}`);

  try {
    // Matrix Client-Server API: POST /_matrix/client/v3/createRoom
    const response = await matrixFetch<{ room_id: string; room_alias?: string }>(
      '/_matrix/client/v3/createRoom',
      {
        method: 'POST',
        body: JSON.stringify({
          name: options.name,
          room_alias_name: options.alias, // Just the local part, without # or :domain
          topic: options.topic,
          invite: options.invite?.map(u => buildUserId(u)),
          preset: options.isPublic ? 'public_chat' : 'private_chat',
          visibility: options.isPublic ? 'public' : 'private',
        }),
      }
    );

    console.log(`[Matrix] ✅ Room created: ${response.room_id}`);
    return {
      success: true,
      roomId: response.room_id,
      roomAlias: roomAlias,
      created: true,
      message: `Room "${options.name}" created successfully`,
    };
  } catch (error) {
    const err = error as Error;
    
    // Check if room alias already exists
    if (err.message.includes('M_ROOM_IN_USE')) {
      console.log(`[Matrix] ℹ️ Room alias already exists: ${roomAlias}`);
      
      // Try to resolve the existing room ID from the alias
      try {
        const aliasResponse = await matrixFetch<{ room_id: string }>(
          `/_matrix/client/v3/directory/room/${encodeURIComponent(roomAlias!)}`
        );
        return {
          success: true,
          roomId: aliasResponse.room_id,
          roomAlias: roomAlias,
          created: false,
          message: `Room ${roomAlias} already exists`,
        };
      } catch {
        // Couldn't resolve alias, return partial success
        return {
          success: true,
          roomId: '',
          roomAlias: roomAlias,
          created: false,
          message: `Room alias ${roomAlias} exists but couldn't resolve room ID`,
        };
      }
    }

    console.error(`[Matrix] ❌ Failed to create room: ${err.message}`);
    throw error;
  }
}

// ============================================================================
// 3. Invite Bot to Room (Matrix Client-Server API)
// ============================================================================

export interface InviteResult {
  success: boolean;
  roomId: string;
  userId: string;
  message: string;
}

/**
 * Invite a user (bot) to a room
 * 
 * @param botName - Username of the bot (e.g., 'kraftbot')
 * @param roomIdOrAlias - Room ID (e.g., '!abc:localhost') or alias (e.g., '#athena:localhost' or 'athena')
 * @returns Result with status
 * 
 * @example
 * await inviteBotToRoom('kraftbot', '!roomId:localhost');
 * // or
 * await inviteBotToRoom('kraftbot', 'athena');
 */
export async function inviteBotToRoom(
  botName: string,
  roomIdOrAlias: string
): Promise<InviteResult> {
  const userId = buildUserId(botName);
  
  // Resolve room ID if given an alias
  let roomId = roomIdOrAlias;
  if (!roomIdOrAlias.startsWith('!')) {
    const alias = buildRoomAlias(roomIdOrAlias);
    console.log(`[Matrix] Resolving room alias: ${alias}`);
    const aliasResponse = await matrixFetch<{ room_id: string }>(
      `/_matrix/client/v3/directory/room/${encodeURIComponent(alias)}`
    );
    roomId = aliasResponse.room_id;
  }

  console.log(`[Matrix] Inviting ${userId} to room ${roomId}`);

  try {
    // Matrix Client-Server API: POST /_matrix/client/v3/rooms/{roomId}/invite
    await matrixFetch(`/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    console.log(`[Matrix] ✅ Invited ${userId} to ${roomId}`);
    return {
      success: true,
      roomId,
      userId,
      message: `Successfully invited ${userId} to room`,
    };
  } catch (error) {
    const err = error as Error;
    
    // User might already be in the room
    if (err.message.includes('M_FORBIDDEN') && err.message.includes('already in the room')) {
      console.log(`[Matrix] ℹ️ User ${userId} already in room ${roomId}`);
      return {
        success: true,
        roomId,
        userId,
        message: `User ${userId} is already in the room`,
      };
    }

    console.error(`[Matrix] ❌ Failed to invite: ${err.message}`);
    throw error;
  }
}

// ============================================================================
// 4. Send Message/Command to Room (Matrix Client-Server API)
// ============================================================================

export interface SendMessageResult {
  success: boolean;
  roomId: string;
  eventId: string;
  message: string;
}

/**
 * Send a text message or command to a room
 * 
 * @param message - The message text or command (e.g., '!baibot access set-handler @kraftbot athena')
 * @param roomIdOrAlias - Room ID or alias
 * @returns Result with eventId
 * 
 * @example
 * await sendCommandMessageToRoom(
 *   '!baibot access set-handler @kraftbot:localhost athena',
 *   'athena'
 * );
 */
export async function sendCommandMessageToRoom(
  message: string,
  roomIdOrAlias: string
): Promise<SendMessageResult> {
  // Resolve room ID if given an alias
  let roomId = roomIdOrAlias;
  if (!roomIdOrAlias.startsWith('!')) {
    const alias = buildRoomAlias(roomIdOrAlias);
    console.log(`[Matrix] Resolving room alias: ${alias}`);
    const aliasResponse = await matrixFetch<{ room_id: string }>(
      `/_matrix/client/v3/directory/room/${encodeURIComponent(alias)}`
    );
    roomId = aliasResponse.room_id;
  }

  // Generate a unique transaction ID
  const txnId = `m${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  console.log(`[Matrix] Sending message to ${roomId}: "${message.substring(0, 50)}..."`);

  try {
    // Matrix Client-Server API: PUT /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}
    const response = await matrixFetch<{ event_id: string }>(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          msgtype: 'm.text',
          body: message,
        }),
      }
    );

    console.log(`[Matrix] ✅ Message sent, event ID: ${response.event_id}`);
    return {
      success: true,
      roomId,
      eventId: response.event_id,
      message: 'Message sent successfully',
    };
  } catch (error) {
    const err = error as Error;
    console.error(`[Matrix] ❌ Failed to send message: ${err.message}`);
    throw error;
  }
}

// ============================================================================
// Utility: Login and get access token
// ============================================================================

export interface LoginResult {
  success: boolean;
  userId: string;
  accessToken: string;
  deviceId: string;
}

/**
 * Login to Matrix and get an access token
 * 
 * @param username - Username (without @domain)
 * @param password - Password
 * @returns Login result with access token
 * 
 * @example
 * const { accessToken } = await loginToMatrix('admin', 'admin_password');
 * initMatrixConfig({ adminAccessToken: accessToken });
 */
export async function loginToMatrix(
  username: string,
  password: string
): Promise<LoginResult> {
  const userId = buildUserId(username);
  
  console.log(`[Matrix] Logging in as: ${userId}`);

  const response = await matrixFetch<{
    user_id: string;
    access_token: string;
    device_id: string;
  }>('/_matrix/client/v3/login', {
    method: 'POST',
    body: JSON.stringify({
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: username,
      },
      password,
      initial_device_display_name: 'AI Hub Provisioner',
    }),
  });

  console.log(`[Matrix] ✅ Logged in as ${response.user_id}`);
  return {
    success: true,
    userId: response.user_id,
    accessToken: response.access_token,
    deviceId: response.device_id,
  };
}

// ============================================================================
// Utility: Check if user exists
// ============================================================================

/**
 * Check if a user exists in the Matrix server
 */
export async function userExists(username: string): Promise<boolean> {
  const userId = buildUserId(username);
  
  try {
    await matrixFetch(`/_synapse/admin/v2/users/${encodeURIComponent(userId)}`);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Utility: Check if room exists
// ============================================================================

/**
 * Check if a room exists by alias
 */
export async function roomExists(alias: string): Promise<boolean> {
  const fullAlias = buildRoomAlias(alias);
  
  try {
    await matrixFetch(`/_matrix/client/v3/directory/room/${encodeURIComponent(fullAlias)}`);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// ORCHESTRATION: Provision All Matrix Resources
// ============================================================================

/**
 * Oracle room definitions - maps agent keys to room configuration
 */
export const ORACLE_ROOMS = [
  {
    agentKey: 'athena',
    name: 'Oracle: Athena',
    alias: 'athena',
    topic: 'Chat with Athena - Data & Analytics Oracle (SQL, dashboards, data analysis)',
    staticHandler: 'static/athena',
  },
  {
    agentKey: 'hephaestus',
    name: 'Oracle: Hephaestus',
    alias: 'hephaestus',
    topic: 'Chat with Hephaestus - Infrastructure & DevOps Oracle (Docker, CI/CD, cloud)',
    staticHandler: 'static/hephaestus',
  },
  {
    agentKey: 'hermes',
    name: 'Oracle: Hermes',
    alias: 'hermes',
    topic: 'Chat with Hermes - Integration & Messaging Oracle (APIs, webhooks, events)',
    staticHandler: 'static/hermes',
  },
  {
    agentKey: 'apollo',
    name: 'Oracle: Apollo',
    alias: 'apollo',
    topic: 'Chat with Apollo - Documentation & Knowledge Oracle (docs, search, answers)',
    staticHandler: 'static/apollo',
  },
] as const;

// The sentinel room used to check if Matrix is already provisioned
const SENTINEL_ROOM_ALIAS = 'athena';

/**
 * Check if Matrix provisioning has already been completed.
 * We use the existence of the #athena room as a sentinel - if it exists,
 * we assume all rooms were provisioned.
 * 
 * @returns true if Matrix appears to be already provisioned
 */
export async function isMatrixProvisioned(): Promise<boolean> {
  try {
    const exists = await roomExists(SENTINEL_ROOM_ALIAS);
    return exists;
  } catch {
    return false;
  }
}

/**
 * Reset Matrix provisioning by deleting all oracle rooms.
 * This requires admin access token to be configured.
 * 
 * Note: In Matrix, rooms can't truly be "deleted" - they can only be
 * "forgotten" and have all members removed. We'll remove the room alias
 * and kick everyone out, effectively making the room inaccessible.
 * 
 * @returns List of rooms that were reset/deleted
 */
export async function resetMatrixProvisioning(): Promise<{
  success: boolean;
  deletedRooms: string[];
  errors: string[];
}> {
  const result = {
    success: false,
    deletedRooms: [] as string[],
    errors: [] as string[],
  };

  console.log('\n🗑️ Resetting Matrix provisioning...');

  for (const oracleRoom of ORACLE_ROOMS) {
    const alias = `#${oracleRoom.alias}:${config.serverName}`;
    
    try {
      // Check if room exists
      const exists = await roomExists(oracleRoom.alias);
      if (!exists) {
        console.log(`   ℹ️ Room ${alias} doesn't exist, skipping`);
        continue;
      }

      // Get room ID from alias
      const aliasResponse = await matrixFetch<{ room_id: string }>(
        `/_matrix/client/v3/directory/room/${encodeURIComponent(alias)}`
      );
      const roomId = aliasResponse.room_id;

      // Use Synapse Admin API to delete the room
      // DELETE /_synapse/admin/v2/rooms/{room_id}
      // This will:
      // - Remove all local users from the room
      // - Remove the room from the room directory
      // - Block new joins
      console.log(`   🗑️ Deleting room ${alias} (${roomId})...`);
      
      try {
        await matrixFetch(`/_synapse/admin/v2/rooms/${encodeURIComponent(roomId)}`, {
          method: 'DELETE',
          body: JSON.stringify({
            purge: true, // Completely remove all traces
            message: 'Room deleted for re-provisioning',
          }),
        });
        result.deletedRooms.push(alias);
        console.log(`   ✅ Deleted ${alias}`);
      } catch (deleteErr) {
        // Try alternative: just remove the alias so we can recreate
        console.log(`   ⚠️ Full delete failed, trying to remove alias only...`);
        try {
          await matrixFetch(
            `/_matrix/client/v3/directory/room/${encodeURIComponent(alias)}`,
            { method: 'DELETE' }
          );
          result.deletedRooms.push(`${alias} (alias only)`);
          console.log(`   ✅ Removed alias ${alias}`);
        } catch (aliasErr) {
          const err = aliasErr as Error;
          result.errors.push(`Failed to delete ${alias}: ${err.message}`);
          console.error(`   ❌ Failed to delete ${alias}: ${err.message}`);
        }
      }
    } catch (error) {
      const err = error as Error;
      result.errors.push(`Error processing ${alias}: ${err.message}`);
      console.error(`   ❌ Error processing ${alias}: ${err.message}`);
    }
  }

  // Wait a bit for deletions to propagate
  console.log('   ⏳ Waiting for deletions to propagate...');
  await sleep(2000);

  result.success = result.errors.length === 0;
  console.log(`\n✅ Reset complete: ${result.deletedRooms.length} rooms deleted`);
  
  return result;
}

export interface MatrixProvisionResult {
  success: boolean;
  skipped: boolean;
  adminUser: {
    userId: string;
    username: string;
    password: string;
  };
  rooms: Array<{
    agentKey: string;
    roomId: string;
    roomAlias: string;
    handlerSet: boolean;
  }>;
  errors: string[];
}

/**
 * Provision all Matrix resources for FlowKraft AI Hub.
 * 
 * This function orchestrates the complete Matrix setup:
 * 1. Checks if already provisioned (skips if rooms exist, unless force=true)
 * 2. Creates admin user (for API calls and human chat access)
 * 3. Creates oracle rooms (#athena, #hephaestus, #hermes, #apollo)
 * 4. Invites kraftbot to each room
 * 5. Waits for kraftbot to join
 * 6. Sets room handler via !kraft command
 * 
 * After this completes, humans can login to Element with admin/admin
 * and immediately start chatting with the oracles.
 * 
 * @param options - Optional configuration
 * @returns Provisioning result with admin credentials and room info
 */
export async function provisionMatrixRooms(options?: {
  /** Admin username (default: 'admin') */
  adminUsername?: string;
  /** Admin password (default: 'admin') */
  adminPassword?: string;
  /** Kraftbot username (default: 'kraftbot') */
  kraftbotUsername?: string;
  /** Delay in ms to wait for bot to join (default: 3000) */
  botJoinDelayMs?: number;
  /** Delay in ms between handler commands (default: 1000) */
  commandDelayMs?: number;
  /** Force re-provisioning: delete existing rooms and start fresh (default: false) */
  force?: boolean;
}): Promise<MatrixProvisionResult> {
  const adminUsername = options?.adminUsername || 'admin';
  const adminPassword = options?.adminPassword || 'admin';
  const kraftbotUsername = options?.kraftbotUsername || 'kraftbot';
  const botJoinDelayMs = options?.botJoinDelayMs || 3000;
  const commandDelayMs = options?.commandDelayMs || 1000;
  const force = options?.force ?? false;

  const result: MatrixProvisionResult = {
    success: false,
    skipped: false,
    adminUser: {
      userId: '',
      username: adminUsername,
      password: adminPassword,
    },
    rooms: [],
    errors: [],
  };

  console.log('\n' + '='.repeat(60));
  console.log('🔮 MATRIX PROVISIONING - FlowKraft AI Hub');
  console.log('='.repeat(60));

  // -------------------------------------------------------------------------
  // Step 0: Check if already provisioned
  // -------------------------------------------------------------------------
  console.log('\n🔍 Checking if Matrix is already provisioned...');
  
  const alreadyProvisioned = await isMatrixProvisioned();
  
  if (alreadyProvisioned) {
    if (force) {
      console.log('⚠️  Force flag set - will reset and re-provision Matrix');
      
      // First, we need admin access to delete rooms
      console.log('\n📝 Getting admin access for reset...');
      try {
        const adminResult = await registerUserWithSharedSecret({
          username: adminUsername,
          password: adminPassword,
          displayName: 'Admin',
          admin: true,
        });
        result.adminUser.userId = adminResult.userId;
        initMatrixConfig({ adminAccessToken: adminResult.accessToken });
      } catch (error) {
        const err = error as Error;
        result.errors.push(`Failed to get admin access for reset: ${err.message}`);
        console.error(`❌ Failed to get admin access: ${err.message}`);
        return result;
      }

      // Now reset
      const resetResult = await resetMatrixProvisioning();
      if (!resetResult.success) {
        console.warn('⚠️  Some rooms could not be deleted, but continuing with provisioning...');
        // Don't fail - we'll try to recreate anyway
      }
    } else {
      console.log('✅ Matrix already provisioned (rooms exist)');
      console.log('   Use force=true to delete and re-provision');
      console.log(`📝 Login credentials: ${adminUsername} / ${adminPassword}`);
      result.success = true;
      result.skipped = true;
      return result;
    }
  } else {
    console.log('📝 Matrix not yet provisioned, proceeding with setup...');
  }

  // -------------------------------------------------------------------------
  // Step 1: Create/login admin user
  // -------------------------------------------------------------------------
  console.log('\n📝 Step 1: Creating admin user...');
  try {
    const adminResult = await registerUserWithSharedSecret({
      username: adminUsername,
      password: adminPassword,
      displayName: 'Admin',
      admin: true,
    });
    
    result.adminUser.userId = adminResult.userId;
    
    // Set the token for subsequent API calls
    initMatrixConfig({ adminAccessToken: adminResult.accessToken });
    
    console.log(`✅ Admin user ready: ${adminResult.userId}`);
    console.log(`   Login credentials: ${adminUsername} / ${adminPassword}`);
  } catch (error) {
    const err = error as Error;
    result.errors.push(`Failed to create admin user: ${err.message}`);
    console.error(`❌ Failed to create admin user: ${err.message}`);
    return result;
  }

  // -------------------------------------------------------------------------
  // Step 2-5: For each oracle room
  // -------------------------------------------------------------------------
  for (const oracleRoom of ORACLE_ROOMS) {
    console.log(`\n🏛️ Processing room: ${oracleRoom.name}`);
    
    const roomResult = {
      agentKey: oracleRoom.agentKey,
      roomId: '',
      roomAlias: `#${oracleRoom.alias}:${config.serverName}`,
      handlerSet: false,
    };

    // Step 2: Create room
    console.log(`   📝 Creating room #${oracleRoom.alias}...`);
    try {
      const createResult = await createRoom({
        name: oracleRoom.name,
        alias: oracleRoom.alias,
        topic: oracleRoom.topic,
        isPublic: true, // Make rooms discoverable
      });
      
      roomResult.roomId = createResult.roomId;
      console.log(`   ✅ Room ${createResult.created ? 'created' : 'exists'}: ${createResult.roomId}`);
    } catch (error) {
      const err = error as Error;
      result.errors.push(`Failed to create room ${oracleRoom.alias}: ${err.message}`);
      console.error(`   ❌ Failed to create room: ${err.message}`);
      result.rooms.push(roomResult);
      continue; // Try next room
    }

    // Step 3: Invite kraftbot
    console.log(`   📨 Inviting @${kraftbotUsername} to room...`);
    try {
      await inviteBotToRoom(kraftbotUsername, roomResult.roomId);
      console.log(`   ✅ Invitation sent`);
    } catch (error) {
      const err = error as Error;
      // Not fatal - bot might already be in room or auto-join
      console.warn(`   ⚠️ Invite issue (may be OK): ${err.message}`);
    }

    // Step 4: Wait for bot to join
    console.log(`   ⏳ Waiting ${botJoinDelayMs}ms for bot to join...`);
    await sleep(botJoinDelayMs);

    // Step 5: Set room handler
    console.log(`   🔧 Setting handler: ${oracleRoom.staticHandler}...`);
    try {
      const handlerCommand = `!kraft config room set-handler text-generation ${oracleRoom.staticHandler}`;
      await sendCommandMessageToRoom(handlerCommand, roomResult.roomId);
      roomResult.handlerSet = true;
      console.log(`   ✅ Handler command sent`);
      
      // Small delay between commands
      await sleep(commandDelayMs);
    } catch (error) {
      const err = error as Error;
      result.errors.push(`Failed to set handler for ${oracleRoom.alias}: ${err.message}`);
      console.error(`   ❌ Failed to set handler: ${err.message}`);
    }

    result.rooms.push(roomResult);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const successCount = result.rooms.filter(r => r.roomId && r.handlerSet).length;
  result.success = successCount === ORACLE_ROOMS.length && result.errors.length === 0;

  console.log('\n' + '='.repeat(60));
  console.log('🔮 MATRIX PROVISIONING COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Rooms provisioned: ${successCount}/${ORACLE_ROOMS.length}`);
  console.log(`📝 Admin login: ${adminUsername} / ${adminPassword}`);
  if (result.errors.length > 0) {
    console.log(`⚠️ Errors: ${result.errors.length}`);
    result.errors.forEach(e => console.log(`   - ${e}`));
  }
  console.log('\n🌐 Open Element at http://localhost:8441 to chat with your oracles!');
  console.log('='.repeat(60) + '\n');

  return result;
}

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Default export
// ============================================================================

export default provisionMatrixRooms;
