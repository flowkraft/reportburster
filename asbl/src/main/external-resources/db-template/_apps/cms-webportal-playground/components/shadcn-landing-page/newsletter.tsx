"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { subscribeToNewsletter } from "@/app/(marketing)/_server-actions/server-actions"

import Turnstile from "../turnstile"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

interface NewsletterState {
  message: string
  success: boolean
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Subscribing..." : "Subscribe"}
    </Button>
  )
}

export const LandingNewsletter = () => {
  const [turnstileToken, setTurnstileToken] = useState<string>("")

  const initialState: NewsletterState = {
    message: "",
    success: false,
  }

  const [state, formAction] = useActionState<NewsletterState, FormData>(
    subscribeToNewsletter,
    initialState
  )

  return (
    <section id="newsletter">
      <h3 className="text-center text-4xl md:text-5xl font-bold">
        Join Our{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Newsletter
        </span>
      </h3>
      <br />
      <form
        action={formAction}
        className="flex flex-col items-center w-full gap-4 md:gap-2"
      >
        <Input
          type="email"
          name="email"
          placeholder="your.name@company.com"
          className="bg-muted/50 dark:bg-muted/80 text-lg h-12 px-4 w-full md:w-[400px] lg:w-[500px]"
          aria-label="email"
          required
        />

        <div className="flex justify-center my-4 w-full md:w-[400px] lg:w-[500px]">
          <div className="w-1/2">
            <Turnstile onVerify={setTurnstileToken} />
          </div>
          <div className="w-1/2 flex items-center justify-center">
            {state.message && (
              <p
                className={`text-sm ${
                  state.success ? "text-green-600" : "text-red-600"
                }`}
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
    </section>
  )
}
