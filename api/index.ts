import { NextFunction, Request, Response } from "express"
import express from "express"
import cors from "cors"
import cookieSession from "cookie-session"
import morgan from "morgan"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import makeRoutes from "./src/makeRoutes"
const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT

app.use(
  cors({
    origin: process.env.FRONT_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use(
  cookieSession({
    name: "touitteur-session",
    secret: process.env.SECRET_COOKIE,
    httpOnly: true,
  })
)
app.use(morgan("dev"))
app.use((req: Request, res: Response, next: NextFunction) => {
  res.sendErrorMessage = (err) => res.status(500).send({ error: err.message })
  next()
})
app.get("/", async (req: Request, res: Response) => {
  return res.status(200).json("🐤 Tweeteur's API 🐤")
})

makeRoutes({ app, prisma })

app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))
