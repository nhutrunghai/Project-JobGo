import { ObjectId } from 'mongodb'
import { StatusCodes } from 'http-status-codes'
import env from '~/configs/env.config'
import { ChatIntent } from '~/constants/chat-intent'
import ErrorCode from '~/constants/error-code'
import UserMessages from '~/constants/messages/index'
import { AppError } from '~/errors/app-error'
import { ChatAnswerResult, RetrievedChatJob, RetrievedResumeChunk } from '~/services/chat/types/chat.type'
import llmService from '~/services/chat/ai/llm.service'
import resumeService from '~/services/client/resume.service'
import contextAssemblyService from './context/context-assembly.service'
import cvVisualReviewService from './review/cv-visual-review.service'
import intentRouterService from './intent/intent-router.service'
import resumeChatRetrievalService from './retrieval/resume-retrieval.service'
import { buildCvReviewAnswerPrompt } from './prompts/cv-review-answer.prompt'
import { buildCvJobMatchJsonAnswerPrompt } from './prompts/cv-job-match-answer.prompt'
import jobChatRetrievalService from './retrieval/job-retrieval.service'
import { buildJobChatAnswerPrompt, buildJobChatJsonAnswerPrompt } from './prompts/job-chat-answer.prompt'
import sessionService from './session.service'
import adminSystemSettingService, { RagChatRuntimeConfig } from '~/services/admin/system-setting.service'

type JobChatJsonAnswer = {
  answer: string
  selected_job_ids: string[]
}

type ChatParams = {
  message: string
  session_id?: string
  resume_id?: string
  user_id: string
}

class RagChatService {
  async chat({ message, session_id, resume_id, user_id }: ChatParams) {
    const normalizedMessage = message.trim()
    const config = await adminSystemSettingService.getRagChatConfig()

    if (!config.enabled) {
      return {
        session_id,
        intent: 'unsupported' as ChatIntent,
        answer: config.maintenance_message || 'Chatbot Ä‘ang táº¡m báº£o trÃ¬. Vui lÃ²ng thá»­ láº¡i sau.',
        sources: []
      }
    }

    const session = await sessionService.loadOrCreateSession(session_id, user_id, normalizedMessage)
    const sessionObjectId = session._id as ObjectId

    await sessionService.appendMessage(sessionObjectId, 'user', normalizedMessage)

    const intentResult = await intentRouterService.detectIntent(normalizedMessage, config)

    if (this.isIntentDisabled(intentResult.intent, config)) {
      const answer = this.buildFallbackAnswer(intentResult.intent)
      await sessionService.appendMessage(sessionObjectId, 'assistant', answer)
      await sessionService.saveState(sessionObjectId, {
        lastIntent: intentResult.intent,
        jobIds: []
      })

      return {
        session_id: sessionService.getSessionId(session),
        intent: intentResult.intent,
        answer,
        sources: []
      }
    }

    if (intentResult.intent === 'cv_review') {
      const response = await this.buildCvReviewAnswer({
        message: normalizedMessage,
        resumeId: resume_id,
        userId: user_id,
        config
      })

      await sessionService.appendMessage(sessionObjectId, 'assistant', response.answer, response.sources)
      await sessionService.saveState(sessionObjectId, {
        lastIntent: intentResult.intent,
        jobIds: []
      })

      return {
        session_id: sessionService.getSessionId(session),
        intent: intentResult.intent,
        answer: response.answer,
        sources: response.sources
      }
    }

    if (intentResult.intent === 'cv_job_match' || intentResult.intent === 'cv_match_previous_jobs') {
      const response = await this.buildCvJobMatchAnswer({
        intent: intentResult.intent,
        message: normalizedMessage,
        resumeId: resume_id,
        userId: user_id,
        lastJobIds: session.last_retrieved_job_ids || [],
        config
      })

      const jobIds = response.sources.filter((source) => source.type === 'job').map((source) => source.job_id)

      await sessionService.appendMessage(sessionObjectId, 'assistant', response.answer, response.sources)
      await sessionService.saveState(sessionObjectId, {
        lastIntent: intentResult.intent,
        jobIds
      })

      return {
        session_id: sessionService.getSessionId(session),
        intent: intentResult.intent,
        answer: response.answer,
        sources: response.sources
      }
    }

    const jobs = await this.retrieveJobsByIntent(
      intentResult.intent,
      normalizedMessage,
      session.last_retrieved_job_ids || [],
      config
    )
    const response = await this.buildAnswer(intentResult.intent, normalizedMessage, jobs, config)

    await sessionService.appendMessage(sessionObjectId, 'assistant', response.answer, response.sources)
    await sessionService.saveState(sessionObjectId, {
      lastIntent: intentResult.intent,
      jobIds: jobs.map((job) => job.job_id)
    })

    return {
      session_id: sessionService.getSessionId(session),
      intent: intentResult.intent,
      answer: response.answer,
      sources: response.sources
    }
  }

  private getRequestedJobLimit(message: string) {
    const normalized = message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0111/g, 'd')

    const explicitMatch = normalized.match(
      /(?:cho\s*(?:toi|minh)\s*)?(\d{1,2})\s*(?:job|jobs|cong\s*viec|viec\s*lam)/i
    )
    const trailingMatch = normalized.match(
      /(?:job|jobs|cong\s*viec|viec\s*lam)\s*(?:backend|frontend|fullstack|java|python|node|react|tester|qa|devops)?\s*(\d{1,2})/i
    )
    const requested = Number(explicitMatch?.[1] || trailingMatch?.[1] || 0)

    if (!Number.isFinite(requested) || requested <= 0) {
      return null
    }

    return Math.min(Math.max(Math.floor(requested), 1), 20)
  }

  private getJobRetrievalLimit(message: string, defaultLimit: number) {
    return this.getRequestedJobLimit(message) || defaultLimit
  }

  private getAnswerContextLimit(message: string, jobsCount: number, config: RagChatRuntimeConfig) {
    const requestedLimit = this.getRequestedJobLimit(message)
    const configuredLimit = Math.max(config.answer_context_limit, 1)
    const limit = requestedLimit || configuredLimit

    return Math.min(limit, jobsCount, 20)
  }

  private async buildCvReviewAnswer({
    message,
    resumeId,
    userId,
    config
  }: {
    message: string
    resumeId?: string
    userId?: string
    config: RagChatRuntimeConfig
  }): Promise<ChatAnswerResult> {
    if (!userId) {
      throw new AppError({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: UserMessages.ACCESS_TOKEN_NOT_FOUND,
        errorCode: ErrorCode.UNAUTHORIZED
      })
    }

    const resume = await resumeService.getResumeForChat(userId, resumeId)
    let chunks: RetrievedResumeChunk[] = []

    try {
      chunks = await resumeChatRetrievalService.retrieveForCvReview(message, resume, config.cv_review_top_k)
    } catch (error) {
      console.error(
        JSON.stringify({
          tag: 'cv_review_text_retrieval_failed',
          resume_id: resume._id ? String(resume._id) : null,
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }

    const visualReviewResult = await cvVisualReviewService.reviewResumePdf({
      message,
      resume
    })

    if (chunks.length === 0 && !visualReviewResult.summary) {
      const fallbackReasons: string[] = ['TÃ´i chÆ°a láº¥y Ä‘Æ°á»£c text CV tá»« Elasticsearch']

      if (!resume.cv_url) {
        fallbackReasons.push('CV nÃ y khÃ´ng cÃ³ `cv_url` Ä‘á»ƒ phÃ¢n tÃ­ch PDF')
      } else if (visualReviewResult.error) {
        fallbackReasons.push(`phÃ¢n tÃ­ch bá»‘ cá»¥c PDF chÆ°a thá»±c hiá»‡n Ä‘Æ°á»£c: ${visualReviewResult.error}`)
      }

      return {
        answer: `Hiá»‡n tÃ´i chÆ°a cÃ³ Ä‘á»§ dá»¯ liá»‡u Ä‘á»ƒ Ä‘Ã¡nh giÃ¡ CV nÃ y. ${fallbackReasons.join(
          ', '
        )}. HÃ£y kiá»ƒm tra láº¡i file CV hoáº·c cháº¡y láº¡i pipeline ingest Ä‘á»ƒ cÃ³ cáº£ text chunks vÃ  dá»¯ liá»‡u PDF há»£p lá»‡.`,
        sources: [this.buildSingleResumeSource(resume)]
      }
    }

    const answer = await llmService.generateText({
      provider: config.provider,
      model: config.chat_model,
      prompt: buildCvReviewAnswerPrompt({
        message,
        chunks,
        visualReviewSummary: visualReviewResult.summary
      })
    })

    return {
      answer,
      sources: chunks.length > 0 ? this.buildResumeSources(chunks) : [this.buildSingleResumeSource(resume)]
    }
  }

  private buildResumeSources(chunks: RetrievedResumeChunk[]) {
    const sourcesMap = new Map<string, ChatAnswerResult['sources'][number]>()

    for (const chunk of chunks) {
      const key = `${chunk.resume_id}:${chunk.chunk_index}`
      if (!sourcesMap.has(key)) {
        sourcesMap.set(key, {
          type: 'resume',
          resume_id: chunk.resume_id,
          title: chunk.title,
          chunk_index: chunk.chunk_index
        })
      }
    }

    return Array.from(sourcesMap.values())
  }

  private buildSingleResumeSource(resume: Awaited<ReturnType<typeof resumeService.getResumeForChat>>) {
    return {
      type: 'resume' as const,
      resume_id: String(resume._id),
      title: resume.title,
      chunk_index: 0
    }
  }

  private async buildCvJobMatchAnswer({
    intent,
    message,
    resumeId,
    userId,
    lastJobIds,
    config
  }: {
    intent: Extract<ChatIntent, 'cv_job_match' | 'cv_match_previous_jobs'>
    message: string
    resumeId?: string
    userId?: string
    lastJobIds: string[]
    config: RagChatRuntimeConfig
  }): Promise<ChatAnswerResult> {
    if (!userId) {
      throw new AppError({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: UserMessages.ACCESS_TOKEN_NOT_FOUND,
        errorCode: ErrorCode.UNAUTHORIZED
      })
    }

    const resume = await resumeService.getResumeForChat(userId, resumeId)
    let chunks: RetrievedResumeChunk[] = []

    try {
      chunks = await resumeChatRetrievalService.retrieveForCvReview(message, resume, config.cv_review_top_k)
    } catch (error) {
      console.error(
        JSON.stringify({
          tag: 'cv_job_match_resume_retrieval_failed',
          resume_id: resume._id ? String(resume._id) : null,
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }

    if (chunks.length === 0) {
      return {
        answer:
          'Hiá»‡n tÃ´i chÆ°a láº¥y Ä‘Æ°á»£c dá»¯ liá»‡u text tá»« CV nÃ y Ä‘á»ƒ so khá»›p vá»›i job. Báº¡n hÃ£y kiá»ƒm tra CV Ä‘Ã£ Ä‘Æ°á»£c ingest embedding hoáº·c chá»n má»™t CV khÃ¡c.',
        sources: [this.buildSingleResumeSource(resume)]
      }
    }

    const jobs =
      intent === 'cv_match_previous_jobs'
        ? await jobChatRetrievalService.retrieveForExplanation(message, lastJobIds, this.getJobRetrievalLimit(message, config.job_explanation_top_k))
        : await jobChatRetrievalService.retrieveForJobSearch(this.buildResumeJobSearchQuery(chunks), this.getJobRetrievalLimit(message, config.job_search_top_k))

    if (intent === 'cv_match_previous_jobs' && jobs.length === 0) {
      return {
        answer:
          'TÃ´i chÆ°a tháº¥y danh sÃ¡ch job nÃ o trÆ°á»›c Ä‘Ã³ trong cuá»™c trÃ² chuyá»‡n nÃ y Ä‘á»ƒ so khá»›p vá»›i CV. Báº¡n hÃ£y tÃ¬m job trÆ°á»›c, vÃ­ dá»¥: "tÃ¬m job backend", rá»“i há»i láº¡i job nÃ o phÃ¹ há»£p vá»›i CV.',
        sources: this.buildResumeSources(chunks)
      }
    }

    if (jobs.length === 0) {
      return {
        answer:
          'Hiá»‡n tÃ´i chÆ°a tÃ¬m tháº¥y job phÃ¹ há»£p Ä‘á»ƒ so khá»›p vá»›i CV nÃ y. Báº¡n cÃ³ thá»ƒ thá»­ nÃªu rÃµ vá»‹ trÃ­ mong muá»‘n, level hoáº·c Ä‘á»‹a Ä‘iá»ƒm.',
        sources: this.buildResumeSources(chunks)
      }
    }

    const contextJobs = jobs.slice(0, this.getAnswerContextLimit(message, jobs.length, config))

    try {
      const jsonAnswer = await llmService.generateJson<JobChatJsonAnswer>({
        provider: config.provider,
        model: config.chat_model,
        prompt: buildCvJobMatchJsonAnswerPrompt({
          message,
          chunks,
          jobs: contextJobs,
          matchMode: intent === 'cv_match_previous_jobs' ? 'previous_jobs' : 'search_all_jobs'
        }),
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            selected_job_ids: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['answer', 'selected_job_ids'],
          additionalProperties: false
        }
      })

      const selectedJobIds = new Set(jsonAnswer.selected_job_ids.filter((jobId) => contextJobs.some((job) => job.job_id === jobId)))
      const selectedJobs = contextJobs.filter((job) => selectedJobIds.has(job.job_id))
      const answerMatchedJobs = selectedJobs.length ? selectedJobs : this.matchJobsMentionedInAnswer(jsonAnswer.answer, contextJobs)

      return {
        answer: jsonAnswer.answer,
        sources: [...contextAssemblyService.buildSources(answerMatchedJobs, answerMatchedJobs.length), ...this.buildResumeSources(chunks)]
      }
    } catch (error) {
      console.warn(
        JSON.stringify({
          tag: 'cv_job_match_json_answer_failed',
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }

    return {
      answer:
        'TÃ´i Ä‘Ã£ tÃ¬m Ä‘Æ°á»£c má»™t sá»‘ job cÃ³ thá»ƒ so khá»›p vá»›i CV, nhÆ°ng chÆ°a táº¡o Ä‘Æ°á»£c pháº§n giáº£i thÃ­ch chi tiáº¿t. Báº¡n cÃ³ thá»ƒ há»i láº¡i ngáº¯n hÆ¡n hoáº·c thá»­ chá»n CV khÃ¡c.',
      sources: [...contextAssemblyService.buildSources(contextJobs, contextJobs.length), ...this.buildResumeSources(chunks)]
    }
  }

  private buildResumeJobSearchQuery(chunks: RetrievedResumeChunk[]) {
    return chunks
      .map((chunk) => chunk.text)
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)
  }

  private async retrieveJobsByIntent(
    intent: ChatIntent,
    message: string,
    lastJobIds: string[],
    config: RagChatRuntimeConfig
  ) {
    switch (intent) {
      case 'job_search':
        return jobChatRetrievalService.retrieveForJobSearch(message, this.getJobRetrievalLimit(message, config.job_search_top_k))
      case 'job_explanation':
        return jobChatRetrievalService.retrieveForExplanation(message, lastJobIds, this.getJobRetrievalLimit(message, config.job_explanation_top_k))
      default:
        return []
    }
  }

  private async buildAnswer(
    intent: ChatIntent,
    message: string,
    jobs: RetrievedChatJob[],
    config: RagChatRuntimeConfig
  ): Promise<ChatAnswerResult> {
    if (intent === 'policy_qa' || intent === 'unsupported') {
      return {
        answer: await this.buildFreeformAnswer(intent, message, config),
        sources: []
      }
    }

    if (jobs.length === 0) {
      return {
        answer:
          'Hiá»‡n tÃ´i chÆ°a tÃ¬m tháº¥y job phÃ¹ há»£p vá»›i cÃ¢u há»i nÃ y. Báº¡n cÃ³ thá»ƒ thá»­ nÃªu rÃµ hÆ¡n vá» ká»¹ nÄƒng, level hoáº·c Ä‘á»‹a Ä‘iá»ƒm.',
        sources: []
      }
    }

    const contextJobs = jobs.slice(0, this.getAnswerContextLimit(message, jobs.length, config))

    try {
      const jsonAnswer = await llmService.generateJson<JobChatJsonAnswer>({
        provider: config.provider,
        model: config.chat_model,
        prompt: buildJobChatJsonAnswerPrompt({
          message,
          jobs: contextJobs
        }),
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            selected_job_ids: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['answer', 'selected_job_ids'],
          additionalProperties: false
        }
      })

      const selectedJobIds = new Set(jsonAnswer.selected_job_ids.filter((jobId) => contextJobs.some((job) => job.job_id === jobId)))
      const selectedJobs = contextJobs.filter((job) => selectedJobIds.has(job.job_id))
      const answerMatchedJobs = selectedJobs.length ? selectedJobs : this.matchJobsMentionedInAnswer(jsonAnswer.answer, contextJobs)
      const sourceJobs = intent === 'job_search' ? contextJobs : answerMatchedJobs

      return {
        answer: jsonAnswer.answer,
        sources: contextAssemblyService.buildSources(sourceJobs, sourceJobs.length)
      }
    } catch (error) {
      console.warn(
        JSON.stringify({
          tag: 'job_chat_json_answer_failed',
          error: error instanceof Error ? error.message : String(error)
        })
      )
    }

    const answer = await llmService.generateText({
      provider: config.provider,
      model: config.chat_model,
      prompt: buildJobChatAnswerPrompt({
        message,
        jobs: contextJobs
      })
    })

    const answerMatchedJobs = this.matchJobsMentionedInAnswer(answer, contextJobs)
    const sourceJobs = intent === 'job_search' ? contextJobs : answerMatchedJobs

    return {
      answer,
      sources: contextAssemblyService.buildSources(sourceJobs, sourceJobs.length)
    }
  }

  private matchJobsMentionedInAnswer(answer: string, jobs: RetrievedChatJob[]) {
    const normalizedAnswer = answer.toLowerCase()
    return jobs.filter((job) => normalizedAnswer.includes(job.job_id.toLowerCase()) || normalizedAnswer.includes(job.title.toLowerCase()))
  }

  private isIntentDisabled(intent: ChatIntent, config: RagChatRuntimeConfig) {
    if (intent === 'cv_review') return !config.allow_cv_review
    if (intent === 'job_search' || intent === 'job_explanation' || intent === 'cv_job_match' || intent === 'cv_match_previous_jobs') return !config.allow_job_qa
    if (intent === 'policy_qa') return !config.allow_policy_qa
    if (intent === 'unsupported') return !config.allow_general_qa
    return false
  }

  private async buildFreeformAnswer(intent: ChatIntent, message: string, config: RagChatRuntimeConfig) {
    const scope = intent === 'policy_qa' ? 'cÃ¢u há»i chÃ­nh sÃ¡ch/quy Ä‘á»‹nh' : 'cÃ¢u há»i ngoÃ i pháº¡m vi tuyá»ƒn dá»¥ng'

    try {
      return await llmService.generateText({
        provider: config.provider,
        model: config.chat_model,
        prompt: `Báº¡n lÃ  trá»£ lÃ½ JobGo. HÃ£y tráº£ lá»i ngáº¯n gá»n, rÃµ rÃ ng báº±ng tiáº¿ng Viá»‡t cho ${scope}. Náº¿u khÃ´ng cháº¯c cháº¯n, hÃ£y nÃ³i rÃµ giá»›i háº¡n thÃ´ng tin.

CÃ¢u há»i cá»§a user:
${message}`
      })
    } catch (error) {
      console.warn(
        JSON.stringify({
          tag: 'freeform_chat_answer_failed',
          intent,
          error: error instanceof Error ? error.message : String(error)
        })
      )
      return this.buildFallbackAnswer(intent)
    }
  }

  private buildFallbackAnswer(intent: ChatIntent) {
    switch (intent) {
      case 'cv_review':
        return 'TÃ­nh nÄƒng Ä‘Ã¡nh giÃ¡ CV sáº½ Ä‘Æ°á»£c há»— trá»£ á»Ÿ bÆ°á»›c sau. Hiá»‡n táº¡i chatbot nÃ y Ä‘ang há»— trá»£ tÆ° váº¥n job trÃªn JobGo. Báº¡n cÃ³ thá»ƒ há»i vá» tÃ¬m job, Ä‘á»™ phÃ¹ há»£p hoáº·c so sÃ¡nh cÃ¡c job.'
      case 'policy_qa':
        return 'TÃ­nh nÄƒng há»i Ä‘Ã¡p vá» luáº­t, quy Ä‘á»‹nh vÃ  tÃ i liá»‡u kiáº¿n thá»©c sáº½ Ä‘Æ°á»£c há»— trá»£ sau khi dá»¯ liá»‡u Ä‘Æ°á»£c táº£i lÃªn há»‡ thá»‘ng. Hiá»‡n táº¡i chatbot nÃ y Ä‘ang há»— trá»£ tÆ° váº¥n job trÃªn JobGo. Báº¡n cÃ³ thá»ƒ há»i vá» tÃ¬m job, Ä‘á»™ phÃ¹ há»£p hoáº·c so sÃ¡nh cÃ¡c job.'
      case 'unsupported':
      default:
        return 'Hiá»‡n táº¡i chatbot nÃ y Ä‘ang há»— trá»£ tÆ° váº¥n job trÃªn JobGo. Báº¡n cÃ³ thá»ƒ há»i vá» tÃ¬m job, Ä‘á»™ phÃ¹ há»£p hoáº·c so sÃ¡nh cÃ¡c job.'
    }
  }
}

const ragChatService = new RagChatService()
export default ragChatService
