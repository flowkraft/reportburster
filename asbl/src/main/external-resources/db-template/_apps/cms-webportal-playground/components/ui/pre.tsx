"use client"

import React from "react"

import { cn } from "@/lib/utils"

import { CopyButton } from "./button-copy-code"

export function Pre({ className, raw, ...props }) {
  //console.log("Pre component received raw:", raw ? "YES" : "NO") // Debug log

  return (
    <div
      className="relative"
      style={{
        position: "relative",
        display: "block",
        marginBottom: "5rem",
      }}
    >
      <pre
        className={cn(
          "mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4",
          className
        )}
        {...props}
      />
      {raw ? (
        <>
          <CopyButton text={raw} />
          <div
            style={{ display: "none" }}
            data-debug="raw-content-present"
          ></div>
        </>
      ) : (
        <div style={{ display: "none" }} data-debug="raw-content-missing"></div>
      )}
    </div>
  )
}
