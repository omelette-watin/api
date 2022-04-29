export {}

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
    interface Response {
      sendErrorMessage: (err: any) => void
    }
  }
}
