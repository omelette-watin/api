const extractHashtags = (str: string): string[] | null => {
  const hashtagRegex = /\B(#[0-9A-Za-zÀ-ÖØ-öø-ÿ_-]+)(?![0-9A-Za-zÀ-ÖØ-öø-ÿ_-])/g
  const hashtags = str.match(hashtagRegex)

  if (hashtags) {
    return hashtags.map((hashtag) => hashtag.replace("#", ""))
  }

  return null
}

export default extractHashtags
