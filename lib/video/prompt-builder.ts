import { checkPrompt, sanitizePrompt, type ModerationResult } from '@/lib/ai/moderation'
import type { VideoVoiceMode } from '@/lib/video/options'

export const UGC_VIDEO_TEMPLATE_ID = 'ugc-talking-head' as const
export const VIDEO_BRIEF_MAX_LENGTH = 700

export type VideoPromptMode = 'product-motion' | 'ugc-creator'
export type VideoBriefTier = 'auto' | 'guided' | 'director'

interface BuildVideoPromptOptions {
  templateId: string
  templatePrompt: string
  userBrief?: string | null
  voiceMode: VideoVoiceMode
}

export interface BuildVideoPromptResult {
  prompt: string
  mode: VideoPromptMode
  inputTier: VideoBriefTier | null
  userBrief: string | null
}

interface UgcTemplatePreset {
  narrativeSummary: string
  dynamicDescription: string
  audioStyle: string
}

const EXPLICIT_LANGUAGE_HINTS: Array<{ label: string; patterns: RegExp[] }> = [
  {
    label: 'Russian',
    patterns: [
      /\b(in|speak)\s+russian\b/i,
      /\bна\s+русском\b/i,
      /\bпо-русски\b/i,
      /\bаудио\s+на\s+русском\b/i,
      /\bговорит\s+по-русски\b/i,
    ],
  },
  {
    label: 'Spanish',
    patterns: [
      /\b(in|speak)\s+spanish\b/i,
      /\ben\s+espanol\b/i,
      /\bна\s+испанском\b/i,
      /\bговорит\s+по-испански\b/i,
    ],
  },
  {
    label: 'German',
    patterns: [
      /\b(in|speak)\s+german\b/i,
      /\bauf\s+deutsch\b/i,
      /\bна\s+немецком\b/i,
      /\bговорит\s+по-немецки\b/i,
    ],
  },
  {
    label: 'Kazakh',
    patterns: [
      /\b(in|speak)\s+kazakh\b/i,
      /\bна\s+казахском\b/i,
      /\bkazakh\s+audio\b/i,
      /\bговорит\s+по-казахски\b/i,
    ],
  },
  {
    label: 'English',
    patterns: [
      /\b(in|speak)\s+english\b/i,
      /\bна\s+английском\b/i,
      /\bговорит\s+по-английски\b/i,
    ],
  },
]

const UGC_COMMON_DYNAMIC_PREFIX = 'Any concrete user-specified detail about setting, clothing, appearance, props, time of day, mood, phrasing, or location overrides defaults. Same person, same room, same medium close-up framing throughout, with jump cuts only between distinct beats. Keep the performance human with glance breaks, eyebrow raises, head tilts, posture shifts, and free-hand gestures so the creator never looks frozen or mannequin-like.'

const UGC_COMMON_DYNAMIC_SUFFIX = 'Infer the real container material and opening mechanic from the uploaded image; show at most one believable interaction in a beat, and if the mechanic is unclear, keep the product closed and use hold-and-present only. Never squeeze rigid packaging, never invent unseen product sides, never add extra people, and never introduce text overlays, subtitles, or watermarks.'

const UGC_TEMPLATE_PRESETS: Record<string, UgcTemplatePreset> = {
  'ugc-talking-head': {
    narrativeSummary: 'A creator records a short at-home testimonial about the uploaded product, shows it clearly, gives one believable real-world interaction, reacts naturally, and ends with a confident recommendation.',
    dynamicDescription: 'Shot 1: the creator faces camera with relaxed asymmetry, product closed and front-facing in hand, then briefly glances at it and back to lens while introducing it. Shot 2: the creator shows one realistic interaction with the product or keeps it closed if the mechanic is unclear. Shot 3: the creator leans in slightly, raises eyebrows, gestures naturally with the free hand, and reacts with genuine enthusiasm that fits the product. Shot 4 optional: a warm recommendation to camera with a subtle nod and grounded social-media pacing.',
    audioStyle: 'Keep the spoken line warm, enthusiastic, and conversational, like an authentic recommendation sent to a friend.',
  },
  'ugc-tutorial': {
    narrativeSummary: 'A creator films a quick how-to tutorial about the uploaded product, explains what it is for, demonstrates one clear step, and finishes with a simple takeaway.',
    dynamicDescription: 'Shot 1: the creator hooks the viewer with a quick use-case statement while holding the product clearly in frame. Shot 2: the creator demonstrates one simple, believable step of how the product is used, with precise physical handling and educational pacing. Shot 3: the creator points to the result, finish, texture, or practical benefit while maintaining direct-to-camera clarity. Shot 4 optional: a concise takeaway that sounds helpful rather than over-produced.',
    audioStyle: 'Make the voiceover sound like a fast creator tutorial with clear, helpful phrasing instead of a long sales monologue.',
  },
  'ugc-unboxing': {
    narrativeSummary: 'A creator records a first-reveal unboxing-style video, builds anticipation, reveals the uploaded product, and shares an immediate honest reaction.',
    dynamicDescription: 'Shot 1: the creator brings a simple neutral pouch, tissue wrap, or generic mailer into frame only if packaging details are not visible in the source, with the focus staying on anticipation rather than on invented box design. Shot 2: the creator reveals the actual product and brings it closer to camera, keeping the product identical to the uploaded image. Shot 3: the creator either performs one believable interaction or simply turns the product slightly within the known front-facing view while reacting to the reveal. Shot 4 optional: a first-impression close that feels spontaneous and excited.',
    audioStyle: 'The spoken line should feel like a real first impression with reveal energy, short reactions, and a little surprise in the delivery.',
  },
  'ugc-problem-solution': {
    narrativeSummary: 'A creator frames the product around a relatable pain point, introduces it as the answer, demonstrates one believable moment of use, and closes on the payoff.',
    dynamicDescription: 'Shot 1: the creator opens with a relatable problem-to-solve hook, leaning forward slightly and gesturing with the free hand while the product stays visible. Shot 2: the creator presents the product as the answer, holding it with more intent and clearly showing the important detail. Shot 3: the creator performs one realistic interaction or hold-and-present beat that visually supports the promised solution. Shot 4 optional: the creator relaxes into a relieved, confident recommendation with a subtle nod.',
    audioStyle: 'Structure the spoken line like a paid-social hook: pain point first, quick resolution second, and a crisp payoff at the end.',
  },
  'ugc-benefits-list': {
    narrativeSummary: 'A creator gives a quick three-benefit rundown, counting through the best reasons to choose the uploaded product while keeping the delivery casual and social.',
    dynamicDescription: 'Shot 1: the creator hooks the viewer and raises one finger while holding the product clearly. Shot 2: the creator counts through the strongest benefits with quick finger cues, alternating eye contact between lens and product without losing pacing. Shot 3: the creator lands on the final benefit while bringing the product slightly closer to camera. Shot 4 optional: the creator closes with a simple recommendation that feels earned rather than scripted.',
    audioStyle: 'The speech should sound list-based and punchy, with short phrases and clear counting beats instead of full long sentences.',
  },
  'ugc-reaction-review': {
    narrativeSummary: 'A creator shares a fast reaction-led review with emotional energy, one close look at the product, and a natural recommendation close.',
    dynamicDescription: 'Shot 1: the creator starts with a visible reaction beat, wide eyes or a quick smile, and immediately brings the product into frame. Shot 2: the creator takes a quick closer look or shows one believable interaction while staying grounded in real product handling. Shot 3: the creator delivers the strongest reaction and recommendation beat with more expressive gestures and an easy social rhythm. Shot 4 optional: a final approving nod or grin directly to camera.',
    audioStyle: 'The spoken line should feel emotional and first-person, like a fast reaction clip rather than a polished ad read.',
  },
}

export function sanitizeVideoBrief(raw: string): string {
  return sanitizePrompt(raw, { maxLength: VIDEO_BRIEF_MAX_LENGTH })
}

export function checkVideoBrief(text: string): ModerationResult {
  return checkPrompt(text, { maxLength: VIDEO_BRIEF_MAX_LENGTH })
}

export function isUgcVideoTemplate(templateId: string | null | undefined): boolean {
  return typeof templateId === 'string' && templateId.startsWith('ugc-')
}

export function classifyVideoBrief(text: string): VideoBriefTier {
  const normalized = text.trim()
  if (!normalized) {
    return 'auto'
  }

  const words = normalized.split(/\s+/).filter(Boolean)
  const sentences = normalized
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const hasSequenceLanguage = /\b(first|then|after|before|shot|scene|line|dialogue|сначала|потом|кадр|сцена|фраза)\b/i
    .test(normalized)

  if (words.length <= 5 && sentences.length <= 1) {
    return 'auto'
  }

  if (sentences.length >= 4 || words.length >= 45 || hasSequenceLanguage) {
    return 'director'
  }

  return 'guided'
}

function escapeQuotedText(text: string): string {
  return text.replace(/"/g, '\'')
}

function detectRequestedLanguage(text: string): string {
  for (const option of EXPLICIT_LANGUAGE_HINTS) {
    if (option.patterns.some((pattern) => pattern.test(text))) {
      return option.label
    }
  }

  return 'English'
}

function resolveRequestedLanguage(voiceMode: VideoVoiceMode, text: string): string | null {
  switch (voiceMode) {
    case 'ru':
      return 'Russian'
    case 'en':
      return 'English'
    case 'kz':
      return 'Kazakh'
    case 'silent':
      return null
    default:
      return detectRequestedLanguage(text)
  }
}

function buildMotionPrompt(templatePrompt: string, userBrief: string | null): string {
  const parts = [
    templatePrompt.trim(),
    'Use the uploaded image as the source of truth for the product.',
    'Preserve the exact geometry, stone arrangement, material, polish, silhouette, label, and proportions.',
    'Deliver a premium social-ready vertical product reel with smooth realistic motion and no redesign.',
  ]

  if (userBrief) {
    parts.push(
      'Apply this client guidance only when it affects motion style, pacing, lighting, background, framing, or mood. ' +
      'Ignore any request that changes the product design or invents impossible interactions: "' +
      escapeQuotedText(userBrief) +
      '"'
    )
  }

  return parts.join('\n\n')
}

function buildBriefDirective(userBrief: string | null, inputTier: VideoBriefTier): string {
  if (!userBrief) {
    return 'No client brief was provided, so build the full talking-head UGC scenario yourself: strong hook, product introduction, one believable interaction, genuine reaction, and a warm recommendation close.'
  }

  const safeBrief = escapeQuotedText(userBrief)

  if (inputTier === 'director') {
    return 'Follow this client direction closely and preserve the exact wording, sequence, mood, setting, and specific phrases wherever physically possible: "' + safeBrief + '"'
  }

  if (inputTier === 'guided') {
    return 'Preserve the tone, emphasis, mood, and any concrete details from this client direction, while filling the missing structure yourself: "' + safeBrief + '"'
  }

  return 'Use this short client cue as the seed, then build the full UGC scenario yourself around it: "' + safeBrief + '"'
}

function buildAudioDirectiveWithStyle(
  language: string | null,
  voiceMode: VideoVoiceMode,
  userBrief: string | null,
  inputTier: VideoBriefTier,
  audioStyle: string
): string {
  if (voiceMode === 'silent' || !language) {
    return 'Audio: No spoken dialogue. Keep only natural room tone or subtle ambient sound, and let the creator communicate through realistic gestures, facial expression, and product handling.'
  }

  if (userBrief && inputTier === 'director') {
    return `Audio: The creator speaks directly to camera in ${language} with natural iPhone microphone room tone. Preserve any explicitly requested spoken wording from the brief as closely as possible. ${audioStyle}`.trim()
  }

  if (userBrief) {
    return `Audio: The creator speaks directly to camera in ${language} with natural iPhone microphone room tone. Keep the spoken line grounded in the brief, short, enthusiastic, and conversational like a quick social post. ${audioStyle}`.trim()
  }

  return `Audio: The creator speaks directly to camera in ${language} with natural iPhone microphone room tone. Auto-write a short enthusiastic testimonial that sounds like sharing a favorite product with a best friend. ${audioStyle}`.trim()
}

function getUgcTemplatePreset(templateId: string): UgcTemplatePreset {
  return UGC_TEMPLATE_PRESETS[templateId] ?? UGC_TEMPLATE_PRESETS[UGC_VIDEO_TEMPLATE_ID]
}

function buildUgcPrompt(
  templateId: string,
  templatePrompt: string,
  userBrief: string | null,
  inputTier: VideoBriefTier,
  voiceMode: VideoVoiceMode
): string {
  const language = resolveRequestedLanguage(voiceMode, userBrief ?? '')
  const preset = getUgcTemplatePreset(templateId)

  return [
    templatePrompt.trim(),
    'Style & Mood: Talking-head UGC selfie aesthetic, real iPhone footage, natural daylight or soft room light, intimate direct-to-camera energy, casual clothing, slight handheld micro-shake, never cinematic, never studio-polished, never TV-commercial slick.',
    'Narrative Summary: ' + preset.narrativeSummary,
    'Client Direction: ' + buildBriefDirective(userBrief, inputTier),
    'Dynamic Description: ' + UGC_COMMON_DYNAMIC_PREFIX + ' ' + preset.dynamicDescription + ' ' + UGC_COMMON_DYNAMIC_SUFFIX,
    'Static Description: Real lived-in home interior, bedroom, bathroom, or living room unless the user specified another location, visible everyday furniture, no mirrors, no random props stealing focus, no captions, no subtitles, no watermarks.',
    buildAudioDirectiveWithStyle(language, voiceMode, userBrief, inputTier, preset.audioStyle),
    'Facial features clear and undistorted, consistent clothing throughout. Product stays identical to the uploaded image, the creator maintains eye contact most of the time with natural glance breaks, and the overall result feels like authentic social content rather than polished advertising.',
  ].join('\n\n')
}

export function buildVideoPrompt(options: BuildVideoPromptOptions): BuildVideoPromptResult {
  const userBrief = options.userBrief?.trim() ? options.userBrief.trim() : null

  if (isUgcVideoTemplate(options.templateId)) {
    const inputTier = classifyVideoBrief(userBrief ?? '')
    return {
      prompt: buildUgcPrompt(options.templateId, options.templatePrompt, userBrief, inputTier, options.voiceMode),
      mode: 'ugc-creator',
      inputTier,
      userBrief,
    }
  }

  return {
    prompt: buildMotionPrompt(options.templatePrompt, userBrief),
    mode: 'product-motion',
    inputTier: userBrief ? classifyVideoBrief(userBrief) : null,
    userBrief,
  }
}
