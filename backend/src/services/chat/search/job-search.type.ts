import { ObjectId } from 'mongodb'
import { JobLevel, JobType } from '~/constants/enums'
import Job from '~/models/schema/client/jobs.schema'

export type SearchPublicJobsParams = {
  q?: string
  location?: string
  job_type?: JobType
  level?: JobLevel
  category_id?: string
  page: number
  limit: number
}

export type SearchHit = {
  job_id: string
  score: number
}

export type SemanticSearchResult = {
  hits: SearchHit[]
  embeddingElapsedMs: number
  semanticSearchElapsedMs: number
}

export type SearchCandidate = {
  job_id: string
  lexical_score: number
  semantic_score: number
  final_score: number
}

export type PublicJobListItem = {
  _id: ObjectId
  title: string
  location: string
  job_type: JobType
  level: JobLevel
  salary: Job['salary']
  skills: string[]
  published_at: Date
  expired_at: Date
  company: {
    _id: ObjectId
    company_name: string
    logo?: string
  }
}

export type SearchScorePreview = {
  job_id: string
  title?: string
  lexical_score: number
  semantic_score: number
  final_score: number
}

export const SEARCH_CANDIDATE_LIMIT = 100
export const SEARCH_SCORE_THRESHOLD = 0.8
export const SEARCH_LEXICAL_MIN_THRESHOLD = 0
export const SEARCH_SEMANTIC_RESCUE_THRESHOLD = 0.92
export const SEARCH_SEMANTIC_RESCUE_LIMIT = 5