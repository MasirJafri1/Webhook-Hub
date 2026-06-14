import { json } from "../utils/response"

export const healthHandler = () => {
  return json({
    status: "ok",
    service: "webhook-platform-api"
  })
}