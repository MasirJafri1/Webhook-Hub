import { Router } from "itty-router"
import { healthHandler } from "./routes/health"
import { versionHandler } from "./routes/version"

const router = Router()

router.get("/health", () => healthHandler())

router.get("/version", () => versionHandler())

export default {
  fetch: (request: Request) => {
    return router.fetch(request)
  }
}