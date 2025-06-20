"use client"

import { useState } from "react"

export function CopyButton({ text }) {
  //console.log("CopyButton received text:", text?.substring(0, 20)) // Debug log with preview of text

  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!text) {
      //console.error("No text provided to copy")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <button
      onClick={copy}
      className="absolute right-2 top-2 z-20 rounded-md bg-gray-800 p-2 text-xs text-white opacity-90 hover:bg-gray-700 hover:opacity-100"
      style={{
        position: "absolute",
        top: "-30px", // Moved higher above the code block
        right: "4px",
        padding: "4px 8px",
        backgroundColor: "rgba(99, 102, 241, 0.9)", // Indigo color for better visibility
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        cursor: "pointer",
        zIndex: 50,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}
