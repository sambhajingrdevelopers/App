import type { NextApiRequest, NextApiResponse } from "next"

export const config = {
  api: {
    bodyParser: false,
  },
}

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      route: "/api/media/enhance",
      backend: BACKEND_URL,
      type: "pages-api-fallback",
    })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const headers: Record<string, string> = {}

    if (req.headers["content-type"]) {
      headers["content-type"] = String(req.headers["content-type"])
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/media/enhance`, {
      method: "POST",
      headers,
      body: req as any,
      // @ts-ignore
      duplex: "half",
    })

    const text = await response.text()
    res.status(response.status)
    res.setHeader("content-type", response.headers.get("content-type") || "application/json")
    return res.send(text)
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "HD enhance proxy failed",
    })
  }
}
