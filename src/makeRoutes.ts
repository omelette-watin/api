import { PrismaClient } from "@prisma/client"
import { Application } from "express"
import makeAuthRoutes from "./routes/makeAuthRoutes"

interface OptionsType {
  app: Application
  prisma: PrismaClient
}

const makeRoutes = (options: OptionsType) => {
  makeAuthRoutes(options)
}

export default makeRoutes
