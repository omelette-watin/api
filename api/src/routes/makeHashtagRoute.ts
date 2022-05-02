import { PrismaClient } from "@prisma/client"
import { Application, Request, Response } from "express"
import { string } from "yup"
import extractHashtags from "../utils/extractHashtags"
import validateBody from "./middlewares/validateBody"
import verifyToken from "./middlewares/verifyToken"

const makeHashtagRoutes = ({
  app,
  prisma,
}: {
  app: Application
  prisma: PrismaClient
}) => {
  app.get("/hashtags/trending", async (req: Request, res: Response) => {
    try {
      const trendingHashtags = await prisma.hashtag.findMany({
        take: 5,
        orderBy: {
          tweets: { _count: "desc" },
        },
        include: {
          _count: {
            select: {
              tweets: true,
            },
          },
        },
      })

      res.status(200).send(trendingHashtags)
    } catch (err: any) {
      res.sendErrorMessage(err)
    }
  })
}

export default makeHashtagRoutes
