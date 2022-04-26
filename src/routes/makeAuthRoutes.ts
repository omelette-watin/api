import { PrismaClient } from "@prisma/client"
import { Application, NextFunction, Request, Response } from "express"
import {
  emailValidator,
  passwordValidator,
  usernameValidator,
} from "../validators"
import validateBody from "./middlewares/validateBody"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { string } from "yup"
import "dotenv/config"

declare module "express-session" {
  interface Session {
    token: string | null
  }
}

const SECRET_KEY = process.env.SECRET_KEY
const makeAuthRoutes = ({
  app,
  prisma,
}: {
  app: Application
  prisma: PrismaClient
}) => {
  app.post(
    "/auth/register",
    validateBody({
      username: usernameValidator.required(),
      password: passwordValidator.required(),
      email: emailValidator.required(),
    }),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { username, email } = req.body

      const existingUsers = await prisma.user.findMany({
        where: {
          OR: [{ username }, { email }],
        },
      })

      if (existingUsers.length) {
        const errors: string[] = []

        existingUsers.forEach((user) => {
          if (user.email === email) {
            errors.push("This email is already used")
          }
          if (user.username === username) {
            errors.push("This username is already used")
          }
        })

        res.status(401).send({ errors })
      }

      next()
    },
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { email, username, password } = req.body
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(password, salt)

      try {
        const newUser = await prisma.user.create({
          data: {
            email,
            username,
            hash,
          },
        })
        const token = jwt.sign({ id: newUser.id }, SECRET_KEY as string, {
          expiresIn: 86400,
        })

        req.session.token = token

        res.status(200).send({
          token,
          message: "Account successfully created",
        })
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post(
    "/auth/login",
    validateBody({ usernameOrEmail: string(), password: string() }),
    async (req: Request, res: Response): Promise<void> => {
      const { usernameOrEmail, password } = req.body

      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
          },
        })

        if (existingUser) {
          const isPasswordValid = await bcrypt.compare(
            password,
            existingUser.hash
          )

          if (isPasswordValid) {
            const token = jwt.sign(
              { id: existingUser.id },
              SECRET_KEY as string,
              { expiresIn: 86400 }
            )

            req.session.token = token

            res.status(200).send({
              token,
              message: "You are logged in",
            })
          }
        }

        res.status(401).send("Invalid Credentials")
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post("/auth/logout", async (req: Request, res: Response) => {
    req.session.token = null

    res.status(200).send({
      message: "You are logged out",
    })
  })
}

export default makeAuthRoutes
