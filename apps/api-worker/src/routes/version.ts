import { json } from "../utils/response"

export const versionHandler = () => {
  return json({
    version: "0.1.0"
  })
}