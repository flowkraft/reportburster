"use client"

 import { useState, useEffect } from "react"
 import { Button } from "@/components/ui/button"
 import { ArrowUpToLine } from "lucide-react"

 export const LandingScrollToTop = () => {
   const [showTopBtn, setShowTopBtn] = useState(false)

   useEffect(() => {
     const handleScroll = () => {
       if (window.scrollY > 400) {
         setShowTopBtn(true)
       } else {
         setShowTopBtn(false)
       }
     }

     // Add event listener
     window.addEventListener("scroll", handleScroll)

     // Clean up the event listener
     return () => window.removeEventListener("scroll", handleScroll)
   }, [])

   const goToTop = () => {
     window.scroll({
       top: 0,
       left: 0,
       behavior: "smooth", // Added smooth scrolling
     })
   }

   return (
    <>
      {showTopBtn && (
        <Button
          onClick={goToTop}
          className="fixed bottom-4 right-4 opacity-90 shadow-md z-50"
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}