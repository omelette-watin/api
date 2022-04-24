import { NextFunction, Request, Response } from "express"
import * as yup from "yup"
import { ObjectShape } from "yup/lib/object"

const validateBody =
  (schema: ObjectShape) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { body } = req

    try {
      req.body = yup
        .object()
        .shape(schema)
        .validateSync(body, { abortEarly: false })
    } catch (err: any) {
      res.status(400).send({
        errors: err.errors,
      })

      return
    }

    next()
  }

export default validateBody
