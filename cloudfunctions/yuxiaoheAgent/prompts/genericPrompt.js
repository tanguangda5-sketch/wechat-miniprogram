function toBlock(title, value) {
  return `${title}:\n${value || "none"}`
}

module.exports = function buildGenericPrompt(payload) {
  const sections = [
    "You are in generic Q&A mode.",
    "Use the user question, recent conversation, user context, tool context, and platform candidates to produce a helpful answer.",
    "",
    toBlock("User question", payload.question),
    "",
    toBlock("Recent conversation", payload.historyText),
    "",
    toBlock("Location", payload.locationText),
    "",
    toBlock("User profile", payload.userProfileText),
    "",
    toBlock("Preferences", payload.preferencesText)
  ]

  if (payload.weatherContext) {
    sections.push("", toBlock("Real-time weather context", payload.weatherContext))
  }

  sections.push(
    "",
    toBlock("Candidate platform content", payload.candidatesText),
    "",
    "Tasks:",
    "1. Write a natural answer.",
    "2. Select 0 to 3 best candidate items for cards when platform content is relevant.",
    "3. Add one short tips string.",
    "4. Add three short guessQuestions.",
    "",
    "Important:",
    "- If the question is about platform content, only use cards from the candidate list.",
    "- If the question is general and cards are not helpful, return an empty cards array.",
    "- Do not invent platform items outside the candidate list.",
    "- guessQuestions must be written as what the user might ask next, not what the assistant says next.",
    "- If real-time weather context is provided, use it naturally instead of sounding like a raw report.",
    "- If the user asks what suits the weather, combine the weather context with platform candidates and explain why.",
    "- Example good guessQuestion: '兰州附近还有哪些适合拍照的景点？'",
    "- Example bad guessQuestion: '需要我帮你规划路线吗？'",
    "- If candidates are weak or the question needs real-time data, be transparent and provide cautious guidance."
  )

  return sections.join("\n")
}
