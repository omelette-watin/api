import { PrismaClient } from "@prisma/client"
import { Application, Request, Response } from "express"
import { string } from "yup"
import validateBody from "./middlewares/validateBody"
import verifyToken from "./middlewares/verifyToken"

const makeUserRoutes = ({
  app,
  prisma,
}: {
  app: Application
  prisma: PrismaClient
}) => {
  app.get("/users/me", verifyToken, async (req: Request, res: Response) => {
    try {
      const me = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          likes: {
            select: {
              tweetId: true,
            },
          },
          retweets: {
            select: {
              tweetId: true,
            },
          },
          following: {
            select: {
              followingId: true,
            },
          },
        },
      })

      if (me) {
        res.status(200).send({
          id: me.id,
          username: me.username,
          profileName: me.profileName || me.username,
          email: me.email,
          urlAvatar: me.urlAvatar || "/avatars/default.svg",
          bio: me.bio || "",
          likes: me.likes.map((like) => like.tweetId),
          retweets: me.retweets.map((retweet) => retweet.tweetId),
          following: me.following.map((follow) => follow.followingId),
        })
      } else {
        res.status(405).send({
          message: "User not found",
        })
      }
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get(
    "/users/me/follows",
    verifyToken,
    async (req: Request, res: Response) => {
      const { userId } = req

      try {
        const follows = await prisma.user.findMany({
          where: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
          select: {
            id: true,
            username: true,
          },
        })
        res.status(200).send({
          follows,
        })
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.get(
    "/users/suggestions",
    verifyToken,
    async (req: Request, res: Response) => {
      const {
        userId,
        query: { take },
      } = req

      try {
        const suggestions = await prisma.user.findMany({
          where: {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
            id: {
              not: userId,
            },
          },
          take: parseInt(take as string) || 3,
          orderBy: {
            followers: {
              _count: "desc",
            },
          },
        })

        res.status(200).send(suggestions)
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.get("/users/search/:search", async (req: Request, res: Response) => {
    const { search } = req.params

    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              profileName: { startsWith: search, mode: "insensitive" },
            },
            { username: { startsWith: search, mode: "insensitive" } },
          ],
        },
        take: 15,
        include: {
          _count: {
            select: {
              followers: true,
            },
          },
        },
        orderBy: {
          followers: {
            _count: "desc",
          },
        },
      })

      res.status(200).send(users)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get("/users/name/:username", async (req: Request, res: Response) => {
    const { username } = req.params

    try {
      const user = await prisma.user.findUnique({
        where: {
          username,
        },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              tweets: true,
              retweets: true,
            },
          },
        },
      })
      if (user) {
        res.status(200).send({
          id: user.id,
          username: user.username,
          profileName: user.profileName || user.username,
          createdAt: user.createdAt,
          urlAvatar: user.urlAvatar || "/avatars/default.svg",
          stats: user._count,
        })
      } else {
        res.status(404).send({
          message: "User not found",
        })
      }
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.post(
    "/users/:followedUserId/follow",
    verifyToken,
    async (req: Request, res: Response) => {
      const {
        userId,
        params: { followedUserId },
      } = req

      try {
        const existingFollow = await prisma.follows.findFirst({
          where: {
            followerId: userId,
            followingId: followedUserId,
          },
        })
        if (existingFollow) {
          await prisma.follows.deleteMany({
            where: {
              followerId: userId,
              followingId: followedUserId,
            },
          })

          res.status(200).send({
            message: "User unfollowed",
          })
        } else {
          await prisma.follows.create({
            data: {
              followerId: userId,
              followingId: followedUserId,
            },
          })

          res.status(200).send({
            message: "User followed",
          })
        }
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post(
    "/users/me",
    verifyToken,
    validateBody({
      urlAvatar: string(),
      profileName: string().max(30),
      bio: string().max(160),
    }),
    async (req: Request, res: Response) => {
      const {
        userId,
        body: { urlAvatar, profileName, bio },
      } = req

      try {
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            urlAvatar,
            profileName,
            bio,
          },
        })

        res.status(200).send({
          message: "User successfuly updated",
          updatedUser,
        })
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )
}

export default makeUserRoutes
