"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Settings2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your application preferences and company details.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Company Information</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Your organization details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-slate-700 dark:text-slate-300">Company Name</Label>
              <Input id="companyName" defaultValue="FlowKraft Inc." className="border-slate-200 dark:border-slate-700 focus:ring-cyan-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Contact Email</Label>
              <Input id="email" type="email" defaultValue="admin@flowkraft.com" className="border-slate-200 dark:border-slate-700 focus:ring-cyan-500" />
            </div>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
              <Settings2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Preferences</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Configure app behavior</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-slate-700 dark:text-slate-300">Default Currency</Label>
              <Input id="currency" defaultValue="USD" className="border-slate-200 dark:border-slate-700 focus:ring-violet-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-slate-700 dark:text-slate-300">Date Format</Label>
              <Input id="dateFormat" defaultValue="MM/DD/YYYY" className="border-slate-200 dark:border-slate-700 focus:ring-violet-500" />
            </div>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
