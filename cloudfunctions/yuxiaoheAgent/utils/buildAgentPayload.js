const basePersonaPrompt = require("../prompts/basePersonaPrompt")
const outputSchemaPrompt = require("../prompts/outputSchemaPrompt")
const buildGenericPrompt = require("../prompts/genericPrompt")

function safeJson(value) {
  return JSON.stringify(value || {}, null, 2)
}

function formatCandidates(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return "no candidate activities"
  }

  return safeJson(
    candidates.map((item) => ({
      id: item._id || "",
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      province: item.province || "",
      city: item.city || "",
      district: item.district || "",
      locationName: item.locationName || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      playTags: Array.isArray(item.playTags) ? item.playTags : [],
      suitableGroups: Array.isArray(item.suitableGroups) ? item.suitableGroups : [],
      priceFrom: item.priceFrom || 0,
      cover: item.cover || ""
    }))
  )
}

module.exports = function buildAgentPayload(input, candidates) {
  const genericPrompt = buildGenericPrompt({
    question: input.question || "",
    locationText: safeJson(input.location || {}),
    userProfileText: safeJson(input.userProfile || {}),
    preferencesText: safeJson(input.preferences || {}),
    candidatesText: formatCandidates(candidates)
  })

  return [basePersonaPrompt, "", outputSchemaPrompt, "", genericPrompt].join("\n\n")
}
