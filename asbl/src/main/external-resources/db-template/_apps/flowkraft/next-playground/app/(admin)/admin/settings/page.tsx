"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Settings2, CreditCard, Loader2 } from "lucide-react"
import { getSetting, setSetting, SETTING_KEYS } from "@/lib/settings"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  
  // Form state
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [defaultCurrency, setDefaultCurrency] = useState("USD")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [paymentProcessor, setPaymentProcessor] = useState("stripe")

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const [name, email, currency, format, processor] = await Promise.all([
          getSetting(SETTING_KEYS.COMPANY_NAME),
          getSetting(SETTING_KEYS.COMPANY_EMAIL),
          getSetting(SETTING_KEYS.DEFAULT_CURRENCY),
          getSetting(SETTING_KEYS.DATE_FORMAT),
          getSetting(SETTING_KEYS.PAYMENT_PROCESSOR),
        ])
        
        if (name) setCompanyName(name)
        if (email) setCompanyEmail(email)
        if (currency) setDefaultCurrency(currency)
        if (format) setDateFormat(format)
        if (processor) setPaymentProcessor(processor)
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const saveCompanySettings = async () => {
    setSaving("company")
    try {
      await Promise.all([
        setSetting(SETTING_KEYS.COMPANY_NAME, companyName, "company", "Company name"),
        setSetting(SETTING_KEYS.COMPANY_EMAIL, companyEmail, "company", "Contact email"),
      ])
      toast({ title: "Company settings saved" })
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const savePreferences = async () => {
    setSaving("preferences")
    try {
      await Promise.all([
        setSetting(SETTING_KEYS.DEFAULT_CURRENCY, defaultCurrency, "preferences", "Default currency"),
        setSetting(SETTING_KEYS.DATE_FORMAT, dateFormat, "preferences", "Date format"),
      ])
      toast({ title: "Preferences saved" })
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const savePaymentSettings = async () => {
    setSaving("payment")
    try {
      await setSetting(SETTING_KEYS.PAYMENT_PROCESSOR, paymentProcessor, "payment", "Default payment processor")
      toast({ title: "Payment settings saved" })
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 id="settings-page-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure your application preferences
        </p>
      </div>

      <div id="settings-cards-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card id="settings-card-company" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">Company</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="companyName" className="text-xs text-slate-600 dark:text-slate-400">Name</Label>
              <Input 
                id="companyName" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="FlowKraft Inc."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="companyEmail" className="text-xs text-slate-600 dark:text-slate-400">Email</Label>
              <Input 
                id="companyEmail" 
                type="email" 
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="admin@company.com"
                className="h-8 text-sm"
              />
            </div>
            <Button 
              id="btn-save-company"
              size="sm" 
              onClick={saveCompanySettings}
              disabled={saving === "company"}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {saving === "company" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card id="settings-card-preferences" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="defaultCurrency" className="text-xs text-slate-600 dark:text-slate-400">Currency</Label>
              <select
                id="defaultCurrency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateFormat" className="text-xs text-slate-600 dark:text-slate-400">Date Format</Label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <Button 
              id="btn-save-preferences"
              size="sm" 
              onClick={savePreferences}
              disabled={saving === "preferences"}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {saving === "preferences" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card id="settings-card-payment" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-200">Payment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="paymentProcessor" className="text-xs text-slate-600 dark:text-slate-400">Default Processor</Label>
              <select
                id="paymentProcessor"
                value={paymentProcessor}
                onChange={(e) => setPaymentProcessor(e.target.value)}
                className="flex h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
              >
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Configure API keys in environment variables
            </p>
            <Button 
              id="btn-save-payment"
              size="sm" 
              onClick={savePaymentSettings}
              disabled={saving === "payment"}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {saving === "payment" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
