"use client"

import * as React from "react"
import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { subscribeToNewsletter } from "./modal-newsletter-server-actions"

interface NewsletterState {
  success: boolean
  message: string | null
}

interface NewsletterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewsletterModal({ open, onOpenChange }: NewsletterModalProps) {
  const [state, formAction] = useFormState<NewsletterState, FormData>(
    subscribeToNewsletter,
    {
      success: false,
      message: null,
    }
  )

  useEffect(() => {
    if (state.success) {
      // Close modal after successful subscription
      setTimeout(() => onOpenChange(false), 2000)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="text-center">
              <strong>
                Thank you for your interest in <em>ReportBurster</em> Report
                Bursting and Report Distribution Software!
              </strong>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-center text-muted-foreground">
            We hope you will find it useful and make something interesting out
            of it.
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              <a
                href="https://www.pdfburst.com/docs/html/quickstart/index.html"
                target="_blank"
                rel="noopener noreferrer help"
                className="hover:text-blue-600"
              >
                1. Quick Starting in 5 Minutes
              </a>
            </h2>
            <p className="text-muted-foreground">
              <a
                href="https://www.pdfburst.com/docs/html/quickstart/index.html"
                target="_blank"
                rel="noopener noreferrer help"
                className="hover:text-blue-600"
              >
                QuickStart - <em>ReportBurster</em> in 5 Minutes
              </a>{" "}
              will help you to quickly get started with email report bursting.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              2. You Want to Take It Easy?
            </h2>
            <p className="mb-4">
              <strong>
                Subscribe to <em>ReportBurster</em> Getting Started Emails
              </strong>{" "}
              which is a series of emails to help you grasp{" "}
              <em>ReportBurster</em> in small chunks.
            </p>

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  className="w-full"
                />
                <input
                  type="hidden"
                  name="autoresponder"
                  value="_GettingStarted_Autoresponder"
                />
              </div>

              {state?.message && (
                <p
                  className={`text-sm ${
                    state?.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {state.message}
                </p>
              )}

              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
