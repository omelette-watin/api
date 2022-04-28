import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import "dotenv/config"

const SECRET_KEY = process.env.SECRET_KEY
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.session.token || req.headers["x-access-token"]

  if (!token) {
    res.status(403).send({ message: "No token provided" })
  } else {
    const { id } = jwt.verify(
      token as string,
      SECRET_KEY as string
    ) as JwtPayload
    if (!id) {
      res.status(401).send({
        message: "Unauthorized",
      })
    } else {
      req.userId = id
      next()
    }
  }
}

export default verifyToken
