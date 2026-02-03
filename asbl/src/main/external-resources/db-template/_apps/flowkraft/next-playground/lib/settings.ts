// Settings API client - Django Constance-like key-value storage
// All settings are persisted to SQLite, not localStorage

export interface Setting {
  id?: number
  key: string
  value: string | null
  category?: string
  description?: string
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.value ?? null
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
  category: string = "general",
  description?: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, category, description }),
    })
    return response.ok
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error)
    return false
  }
}

/**
 * Get all settings for a category
 */
export async function getSettingsByCategory(category: string): Promise<Setting[]> {
  try {
    const response = await fetch(`/api/settings?category=${encodeURIComponent(category)}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error)
    return []
  }
}

/**
 * Batch update multiple settings
 */
export async function setSettings(settings: Setting[]): Promise<boolean> {
  try {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    return response.ok
  } catch (error) {
    console.error("Error batch updating settings:", error)
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
  
  // Payment settings
  PAYMENT_PROCESSOR: "payment.processor",  // "stripe" or "paypal"
  STRIPE_ENABLED: "payment.stripe.enabled",
  PAYPAL_ENABLED: "payment.paypal.enabled",
} as const
