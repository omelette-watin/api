import { PrismaClient } from "@prisma/client"
import { Application } from "express"
import makeAuthRoutes from "./routes/makeAuthRoutes"
import makeTweetRoutes from "./routes/makeTweetRoutes"
import makeUserRoutes from "./routes/makeUserRoutes"

interface OptionsType {
  app: Application
  prisma: PrismaClient
}

const makeRoutes = (options: OptionsType) => {
  makeAuthRoutes(options)
  makeUserRoutes(options)
  makeTweetRoutes(options)
}

export default makeRoutes
