import { PrismaClient } from "@prisma/client"
import { Application, Request, Response } from "express"

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

  app.get("/hashtags/search/:search", async (req: Request, res: Response) => {
    const {
      params: { search },
      query: { cursor },
    } = req

    try {
      const hashtags = await prisma.hashtag.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
          id: {
            lt: cursor as string | undefined,
          },
        },
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
      })

      res.status(200).send(hashtags)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })
}

export default makeHashtagRoutes
