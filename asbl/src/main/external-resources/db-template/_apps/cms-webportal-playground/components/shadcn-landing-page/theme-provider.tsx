"use client"

 import * as React from "react"
 import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"
 
 export function LandingThemeProvider({ children, ...props }: ThemeProviderProps) {
   return (
     <NextThemesProvider
       attribute="class"
       defaultTheme="system"
       enableSystem
       disableTransitionOnChange
       {...props}
     >
       {children}
     </NextThemesProvider>
   )
 }