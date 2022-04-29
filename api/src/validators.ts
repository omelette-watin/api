import { string } from "yup"

export const usernameValidator = string()
  .label("Username")
  .trim()
  .min(3)
  .max(15)
  .matches(
    /^[0-9A-Za-zÀ-ÖØ-öø-ÿ_-]+$/,
    "Username cannot contain special characters or spaces"
  )

export const emailValidator = string().label("E-mail").email().trim()

export const passwordValidator = string()
  .label("Password")
  .min(8)
  .matches(
    /\d/,
    "Password must contain at least 1 upper case, 1 lower case and one number"
  )
  .matches(
    /[A-ZÀ-Ö]/,
    "Password must contain at least 1 upper case, 1 lower case and one number"
  )
  .matches(
    /[a-zØ-öø-ÿ]/,
    "Password must contain at least 1 upper case, 1 lower case and one number"
  )
