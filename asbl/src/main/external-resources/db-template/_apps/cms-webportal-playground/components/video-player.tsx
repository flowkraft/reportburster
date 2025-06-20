"use client"

import dynamic from "next/dynamic"

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false })

export function VideoPlayer() {
  return (
    <div className="aspect-video">
      <ReactPlayer
        url="/videos/0000-quickstart-en-US-Journey-D-elevate.mp4"
        width="100%"
        height="100%"
        controls={true}
        playing={false}
        playsinline={true}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous", // Add this for CDN (Cloudfare)
              preload: "auto", // Enable preloading
              poster:
                "/videos/0000-quickstart-en-US-Journey-D-elevate-thumbnail-2.png", // Optional: Add a thumbnail while loading
            },
            forceVideo: true,
          },
        }}
      />
    </div>
  )
}
