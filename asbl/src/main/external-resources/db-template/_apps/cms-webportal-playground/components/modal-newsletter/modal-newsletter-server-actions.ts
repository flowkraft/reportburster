"use server"

import { z } from "zod"

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function subscribeToNewsletter(
  prevState: { success: boolean; message: string | null },
  formData: FormData
) {
  const email = formData.get("email")

  try {
    const validated = subscribeSchema.parse({ email })

    // TODO: Add your email processing logic here
    // Example: Save to database, call newsletter API, etc.
    console.log("Processing subscription for:", validated.email)

    return {
      success: true,
      message: "Thank you for subscribing!",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof z.ZodError
          ? "Please enter a valid email address"
          : "Failed to subscribe. Please try again.",
    }
  }
}
