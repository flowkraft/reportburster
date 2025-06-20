"use server"

import nodemailer from "nodemailer"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  getMauticToken,
  validateApiKey,
  verifyTurnstileToken,
} from "@/app/utils/helpers"

interface NewsletterState {
  message: string
  success: boolean
  errors?: string
}

const emailSchema = z.string().email("Invalid email address")

export async function subscribeToNewsletter(
  prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  try {
    // if (!(await validateApiKey())) {
    //   return { message: "Unauthorized", success: false }
    // }

    const token = formData.get("cf-turnstile-response")
    const isValid = await verifyTurnstileToken(token as string)
    if (!isValid) {
      return {
        ...prevState,
        message: "Invalid CAPTCHA. Please try again.",
        success: false,
      }
    }

    const email = formData.get("email")?.toString()
    // Validate email
    const emailResult = emailSchema.safeParse(email)
    if (!emailResult.success) {
      return { message: "Invalid email address", success: false }
    }

    // Prepare form data object containing only the email address
    const formDataObj = { email: emailResult.data }
    const formDataStr = JSON.stringify(formDataObj)

    // Save to database with form_type 'newsletter'
    await db.$executeRaw`
        INSERT INTO rbcom_forms (form_type, form_data)
        VALUES ('newsletter', ${formDataStr})
      `

    // Send email notification
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.MAILGUN_FROM_EMAIL,
      to: process.env.CONTACT_FORM_RECIPIENT,
      subject: "New Newsletter Subscription",
      text: `New newsletter subscription:\n\nEmail Address: ${emailResult.data}`,
    })

    return { message: "Successfully subscribed!", success: true }
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return { message: "Subscription failed. Please try again.", success: false }
  }
}

const contactSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    //if (!(await validateApiKey())) {
    //  return { message: "Unauthorized", errors: null }
    //}

    const token = formData.get("cf-turnstile-response")

    const isValid = await verifyTurnstileToken(token as string)
    if (!isValid) {
      return {
        ...prevState,
        message: "Invalid CAPTCHA. Please try again.",
        success: false,
      }
    }

    const validatedFields = contactSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      message: formData.get("message"),
    })
    console.log(
      "Form Data:",
      validatedFields.success ? validatedFields.data : validatedFields.error
    )

    if (!validatedFields.success) {
      return {
        ...prevState,
        errors: validatedFields.error.flatten().fieldErrors,
        message: null,
      }
    }

    // Save to database
    const formDataStr = JSON.stringify(validatedFields.data)
    await db.$executeRaw`
        INSERT INTO rbcom_forms (form_type, form_data)
        VALUES ('contact_us', ${formDataStr})
      `

    // Send email notification
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    // Log email configuration
    console.log("Email Config:", {
      host: "smtp.mailgun.org",
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN?.substring(0, 5) + "...", // Show first 5 chars only
        passLength: process.env.MAILGUN_SMTP_PASSWORD ? "Set" : "Missing",
        from: process.env.MAILGUN_FROM_EMAIL,
        to: process.env.CONTACT_FORM_RECIPIENT,
      },
    })

    await transporter.sendMail({
      from: process.env.MAILGUN_FROM_EMAIL,
      to: process.env.CONTACT_FORM_RECIPIENT,
      subject: "New Contact Form Submission",
      text: `
          New contact form submission:
          
          Name: ${validatedFields.data.firstName} ${validatedFields.data.lastName}
          Email: ${validatedFields.data.email}
          Message: ${validatedFields.data.message}
        `,
    })

    return {
      ...prevState,
      message: "Message sent successfully!",
      errors: null,
    }
  } catch (error) {
    console.error("Form submission error:", error)
    return {
      ...prevState,
      message: "An error occurred. Please try again.",
      errors: null,
    }
  }
}

const partnerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  organization: z.string().min(2, "Organization name is required"),
  titleRole: z.string().min(2, "Title/Role is required"),
  email: z.string().email("Invalid email address"),
  proposedRelationship: z
    .string()
    .min(20, "Proposal must be at least 20 characters"),
})

export async function submitPartnerForm(prevState: any, formData: FormData) {
  try {
    //if (!(await validateApiKey())) {
    //  return { message: "Unauthorized", errors: null }
    //}

    const token = formData.get("cf-turnstile-response")

    const isValid = await verifyTurnstileToken(token as string)
    if (!isValid) {
      return {
        ...prevState,
        message: "Invalid CAPTCHA. Please try again.",
        success: false,
      }
    }

    const validated = partnerSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      organization: formData.get("organization"),
      titleRole: formData.get("titleRole"),
      email: formData.get("email"),
      proposedRelationship: formData.get("proposedRelationship"),
    })

    console.log(
      "2. Validation Result:",
      validated.success ? "Valid" : validated.error.flatten()
    )

    if (!validated.success) {
      return {
        ...prevState,
        errors: validated.error.flatten().fieldErrors,
        message: null,
      }
    }

    console.log("3. Before DB Save:", validated.data)

    // Save to database
    const formDataStr = JSON.stringify(validated.data)
    const savedForm = await db.$executeRaw`
        INSERT INTO rbcom_forms (form_type, form_data)
        VALUES ('partners', ${formDataStr})
      `

    console.log("4. After DB Save:", savedForm)

    console.log("5. Before Email Send:", {
      to: process.env.CONTACT_FORM_RECIPIENT,
      from: process.env.MAILGUN_FROM_EMAIL,
    })

    // Send email notification
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.MAILGUN_FROM_EMAIL,
      to: process.env.CONTACT_FORM_RECIPIENT,
      subject: "New Partnership Inquiry",
      text: `
          New partnership inquiry:
          
          Name: ${validated.data.firstName} ${validated.data.lastName}
          Organization: ${validated.data.organization}
          Title/Role: ${validated.data.titleRole}
          Email: ${validated.data.email}
          Proposed Relationship: ${validated.data.proposedRelationship}
        `,
    })

    return {
      ...prevState,
      message: "Partnership inquiry submitted successfully!",
      errors: null,
    }
  } catch (error) {
    console.error("6. Error Details:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      ...prevState,
      message: "An error occurred. Please try again.",
      errors: null,
    }
  }
}
