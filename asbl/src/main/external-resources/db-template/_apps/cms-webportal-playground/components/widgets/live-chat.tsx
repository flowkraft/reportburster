"use client"

import { useEffect } from "react"

const LiveChat = () => {
  useEffect(() => {
    ;(function (w: any, d: Document, s: string, u: string) {
      w.RocketChat = function (c: any) {
        w.RocketChat._.push(c)
      }
      w.RocketChat._ = []
      w.RocketChat.url = u
      const h = d.getElementsByTagName(s)[0]
      const j = d.createElement(s) as HTMLScriptElement // Cast to HTMLScriptElement
      j.async = true
      j.src =
        "https://chat.reportburster.com/livechat/rocketchat-livechat.min.js?_=201903270000"
      h.parentNode?.insertBefore(j, h)
    })(window, document, "script", "https://chat.reportburster.com/livechat")
  }, [])

  return null
}

export default LiveChat
