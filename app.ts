import express from "express"
import { Request, Response } from "express"
import cors from "cors"
import cookieSession from "cookie-session"
import morgan from "morgan"
import "dotenv/config"

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
app.get("/", async (req: Request, res: Response) => {
  return res.status(200).json("🐤 Tweeteur's API 🐤")
})

app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))
