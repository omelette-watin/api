import { PrismaClient } from "@prisma/client"
import { Application, Request, Response } from "express"
import { string } from "yup"
import extractHashtags from "../utils/extractHashtags"
import validateBody from "./middlewares/validateBody"
import verifyToken from "./middlewares/verifyToken"

const makeTweetRoutes = ({
  app,
  prisma,
}: {
  app: Application
  prisma: PrismaClient
}) => {
  const handleHashtags = async (hashtags: string[]) => {
    const existingHashtags = await prisma.hashtag.findMany({
      where: {
        name: {
          in: hashtags,
        },
      },
    })
    const notExistingHashtags = hashtags.filter(
      (hashtag) =>
        !existingHashtags
          .map((existingHashtag) => existingHashtag.name)
          .includes(hashtag)
    )

    return { existingHashtags, notExistingHashtags }
  }

  app.post(
    "/tweets/",
    verifyToken,
    validateBody({
      plainText: string().required(),
    }),
    async (req: Request, res: Response) => {
      const {
        userId,
        body: { plainText },
      } = req

      try {
        const hashtags = extractHashtags(plainText)

        if (!hashtags) {
          const newTweet = await prisma.tweet.create({
            data: {
              plainText,
              authorId: userId,
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "tweet",
              authorId: userId,
              createdAt: newTweet.createdAt,
              targetTweetId: newTweet.id,
            },
          })

          res.status(200).send({
            message: "Tweet posted",
            tweetId: newTweet.id,
            tweetEventId: newTweetEvent.id,
          })
        } else {
          const { existingHashtags, notExistingHashtags } =
            await handleHashtags(hashtags)

          const newTweet = await prisma.tweet.create({
            data: {
              plainText,
              authorId: userId,
              hashtags: {
                connect: existingHashtags.map((hashtag) => ({
                  id: hashtag.id,
                })),
                create: notExistingHashtags.map((hashtag) => ({
                  name: hashtag,
                })),
              },
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "tweet",
              authorId: userId,
              createdAt: newTweet.createdAt,
              targetTweetId: newTweet.id,
            },
          })

          res.status(200).send({
            message: "Tweet posted",
            tweetId: newTweet.id,
            tweetEventId: newTweetEvent.id,
          })
        }
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post(
    "/tweets/:tweetId/reply",
    verifyToken,
    validateBody({
      plainText: string().required(),
    }),
    async (req: Request, res: Response) => {
      const {
        userId,
        params: { tweetId },
        body: { plainText },
      } = req

      try {
        const hashtags = extractHashtags(plainText)

        if (!hashtags) {
          const newTweet = await prisma.tweet.create({
            data: {
              plainText,
              authorId: userId,
              originalTweetId: tweetId,
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "reply",
              authorId: userId,
              createdAt: newTweet.createdAt,
              targetTweetId: newTweet.id,
            },
          })

          res.status(200).send({
            message: "Reply posted",
            tweetId: newTweet.id,
            tweetEventId: newTweetEvent.id,
          })
        } else {
          const { existingHashtags, notExistingHashtags } =
            await handleHashtags(hashtags)

          const newTweet = await prisma.tweet.create({
            data: {
              plainText,
              authorId: userId,
              originalTweetId: tweetId,
              hashtags: {
                connect: existingHashtags.map((hashtag) => ({
                  id: hashtag.id,
                })),
                create: notExistingHashtags.map((hashtag) => ({
                  name: hashtag,
                })),
              },
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "reply",
              authorId: userId,
              createdAt: newTweet.createdAt,
              targetTweetId: newTweet.id,
            },
          })

          res.status(200).send({
            message: "Reply posted",
            tweetId: newTweet.id,
            tweetEventId: newTweetEvent.id,
          })
        }
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post(
    "/tweets/:tweetId/like",
    verifyToken,
    async (req: Request, res: Response) => {
      const {
        userId,
        params: { tweetId },
      } = req
      try {
        const existingLike = await prisma.like.findFirst({
          where: {
            tweetId,
            userId,
          },
        })

        if (existingLike) {
          await prisma.like.delete({
            where: {
              id: existingLike.id,
            },
          })
          await prisma.tweetEvent.deleteMany({
            where: {
              type: "like",
              authorId: userId,
              targetTweetId: tweetId,
            },
          })

          res.status(200).send({ message: "Tweet unliked" })
        } else {
          await prisma.like.create({
            data: {
              userId,
              tweetId,
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "like",
              authorId: userId,
              targetTweetId: tweetId,
            },
          })

          res
            .status(200)
            .send({ message: "Tweet liked", tweetEventId: newTweetEvent.id })
        }
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.post(
    "/tweets/:tweetId/retweet",
    verifyToken,
    async (req: Request, res: Response) => {
      const {
        userId,
        params: { tweetId },
      } = req
      try {
        const existingRetweet = await prisma.retweet.findFirst({
          where: {
            tweetId,
            userId,
          },
        })

        if (existingRetweet) {
          await prisma.retweet.delete({
            where: {
              id: existingRetweet.id,
            },
          })
          await prisma.tweetEvent.deleteMany({
            where: {
              type: "retweet",
              authorId: userId,
              targetTweetId: tweetId,
            },
          })

          res.status(200).send({ message: "Tweet not retweeted anymore" })
        } else {
          await prisma.retweet.create({
            data: {
              userId,
              tweetId,
            },
          })
          const newTweetEvent = await prisma.tweetEvent.create({
            data: {
              type: "retweet",
              authorId: userId,
              targetTweetId: tweetId,
            },
          })

          res.status(200).send({
            message: "Tweet retweeted",
            tweetEventId: newTweetEvent.id,
          })
        }
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.get("/tweets", async (req: Request, res: Response) => {
    const { cursor } = req.query

    try {
      const tweets = await prisma.tweet.findMany({
        where: {
          id: {
            lt: cursor as string | undefined,
          },
        },
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              username: true,
              profileName: true,
              urlAvatar: true,
              id: true,
            },
          },
          originalTweet: {
            select: {
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
              retweets: true,
            },
          },
        },
      })

      res.status(200).send(tweets)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get(
    "/tweets/myfeed",
    verifyToken,
    async (req: Request, res: Response) => {
      const {
        userId,
        query: { cursor },
      } = req

      try {
        const myfeed = await prisma.tweetEvent.findMany({
          where: {
            id: {
              lt: cursor as string | undefined,
            },
            author: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          take: 8,
          orderBy: {
            createdAt: "desc",
          },
          distinct: ["targetTweetId"],
          include: {
            author: {
              select: {
                username: true,
                profileName: true,
                urlAvatar: true,
                id: true,
              },
            },
            targetTweet: {
              include: {
                originalTweet: {
                  select: {
                    author: {
                      select: {
                        username: true,
                      },
                    },
                  },
                },
                author: {
                  select: {
                    username: true,
                    profileName: true,
                    urlAvatar: true,
                    id: true,
                  },
                },
                _count: {
                  select: {
                    replies: true,
                    likes: true,
                    retweets: true,
                  },
                },
              },
            },
          },
        })

        res.status(200).send(myfeed)
      } catch (err) {
        res.sendErrorMessage(err)
      }
    }
  )

  app.get("/tweets/:tweetId", async (req: Request, res: Response) => {
    const { tweetId } = req.params

    try {
      const tweet = await prisma.tweet.findUnique({
        where: {
          id: tweetId,
        },
        include: {
          author: {
            select: {
              username: true,
              profileName: true,
              urlAvatar: true,
              id: true,
            },
          },
          originalTweet: {
            select: {
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
              retweets: true,
            },
          },
        },
      })

      if (!tweet) {
        res.status(404).send({
          message: "Tweet not found",
        })
      } else {
        res.status(200).send(tweet)
      }
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get("/tweets/:tweetId/replies", async (req: Request, res: Response) => {
    const {
      params: { tweetId },
      query: { cursor },
    } = req

    try {
      const tweetReplies = await prisma.tweet.findMany({
        where: {
          originalTweetId: tweetId,
          id: {
            lt: (cursor as string) || undefined,
          },
        },
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              username: true,
              profileName: true,
              urlAvatar: true,
              id: true,
            },
          },
          originalTweet: {
            select: {
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
              retweets: true,
            },
          },
        },
      })

      res.status(200).send(tweetReplies)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get("/tweets/hashtag/:hashtag", async (req: Request, res: Response) => {
    const {
      params: { hashtag },
      query: { cursor },
    } = req

    try {
      const tweetsByHashtags = await prisma.tweet.findMany({
        where: {
          hashtags: {
            some: {
              name: hashtag,
            },
          },
          id: {
            lt: (cursor as string) || undefined,
          },
        },
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              username: true,
              profileName: true,
              urlAvatar: true,
              id: true,
            },
          },
          originalTweet: {
            select: {
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
              retweets: true,
            },
          },
        },
      })

      res.status(200).send(tweetsByHashtags)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })

  app.get("/tweets/user/:userId", async (req: Request, res: Response) => {
    const {
      params: { userId },
      query: { cursor },
    } = req

    try {
      const tweetsByHashtags = await prisma.tweet.findMany({
        where: {
          authorId: userId,
          id: {
            lt: (cursor as string) || undefined,
          },
        },
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              username: true,
              profileName: true,
              urlAvatar: true,
              id: true,
            },
          },
          originalTweet: {
            select: {
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
              retweets: true,
            },
          },
        },
      })

      res.status(200).send(tweetsByHashtags)
    } catch (err) {
      res.sendErrorMessage(err)
    }
  })
}

export default makeTweetRoutes
