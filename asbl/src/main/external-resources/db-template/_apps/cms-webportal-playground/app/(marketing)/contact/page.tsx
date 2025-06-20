"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Turnstile from "@/components/turnstile"

import { submitContactForm } from "../_server-actions/server-actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? "Sending..." : "Send Message"}
    </Button>
  )
}

export default function ContactPage() {
  const [turnstileToken, setTurnstileToken] = useState<string>("")

  const [state, formAction] = useActionState(submitContactForm, {
    message: null,
    errors: null,
  })

  return (
    <section className="container flex flex-col gap-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Contact Us
        </h2>

        <form
          id="contactForm"
          action={formAction}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                name="firstName"
                id="firstName"
                required
                className={state.errors?.firstName && "border-red-500"}
              />
              {state.errors?.firstName && (
                <p className="text-sm text-red-500">{state.errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                name="lastName"
                id="lastName"
                required
                className={state.errors?.lastName && "border-red-500"}
              />
              {state.errors?.lastName && (
                <p className="text-sm text-red-500">{state.errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              name="email"
              id="email"
              required
              className={state.errors?.email && "border-red-500"}
            />
            {state.errors?.email && (
              <p className="text-sm text-red-500">{state.errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={8}
              required
              className={cn(
                "resize-none",
                state.errors?.message && "border-red-500"
              )}
            />
            {state.errors?.message && (
              <p className="text-sm text-red-500">{state.errors.message}</p>
            )}
          </div>

          <div className="flex gap-4 my-4 w-full md:w-auto">
            <div className="w-1/2">
              <Turnstile
                onVerify={(token) => {
                  console.log("Turnstile Token Received:", token)
                  setTurnstileToken(token)
                }}
              />
            </div>
            <div className="w-1/2 flex items-center justify-center">
              {state.message && (
                <p
                  className={cn(
                    state.errors ? "text-red-500" : "text-green-500"
                  )}
                >
                  {state.message}
                </p>
              )}
            </div>
          </div>

          <input
            type="hidden"
            name="cf-turnstile-response"
            value={turnstileToken}
          />

          <SubmitButton />
        </form>

        <div className="mt-8 rounded-lg bg-muted p-6">
          <h2 className="text-xl font-semibold">
            SourceKraft Systems & Consulting Ltd
          </h2>
          <address className="mt-2 not-italic">
            Spyrou Kyprianou & Agias Phylaxeos 182 (Corner)
            <br />
            Kofteros Business Center, 2ND Floor, Office 201
            <br />
            3083 Limassol
            <br />
            Cyprus, European Union
          </address>
        </div>
      </div>
    </section>
  )
}
