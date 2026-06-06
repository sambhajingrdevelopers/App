import type { NextApiRequest, NextApiResponse } from "next"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = String(req.query.url || "")

    if (!raw) {
      return res.status(400).json({ success: false, message: "Media URL missing" })
    }

    const target = raw.startsWith("http")
      ? raw
      : `${BACKEND_URL}${raw.startsWith("/") ? raw : `/media/${raw}`}`

    const response = await fetch(target, { cache: "no-store" })
    const contentType = response.headers.get("content-type") || "application/octet-stream"

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
        status: response.status,
        target,
      })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.status(200)
    res.setHeader("content-type", contentType)
    res.setHeader("cache-control", "no-store")
    return res.send(buffer)
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Media proxy failed",
    })
  }
}
