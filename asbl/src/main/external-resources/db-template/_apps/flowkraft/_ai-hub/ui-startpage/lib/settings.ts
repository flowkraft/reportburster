// Settings API client - Django Constance-like key-value storage
// All settings are persisted to SQLite, not localStorage

export interface Setting {
  key: string
  value: string | null
  description?: string
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/config?key=${encodeURIComponent(key)}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.config?.value ?? null
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }
}

/**
 * Set a single setting
 */
export async function setSetting(
  key: string,
  value: string | null,
  description?: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, description }),
    })
    return response.ok
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error)
    return false
  }
}

// Common setting keys as constants
export const SETTING_KEYS = {
  // Theme settings
  THEME_MODE: "theme.mode",          // "light" or "dark"
  THEME_COLOR: "theme.color",        // color theme name
  
  // Company settings
  COMPANY_NAME: "company.name",
  COMPANY_EMAIL: "company.email",
  COMPANY_ADDRESS: "company.address",
  
  // Preferences
  DEFAULT_CURRENCY: "preferences.currency",
  DATE_FORMAT: "preferences.dateFormat",
} as const
