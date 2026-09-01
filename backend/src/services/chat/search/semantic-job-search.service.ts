import { performance } from 'node:perf_hooks'
import ElasticsearchConfig from '~/configs/elasticsearch.config'
import env from '~/configs/env.config'
import { generateLocalEmbedding } from '~/services/chat/ai/embedding.service'
import lexicalJobSearchService from './lexical-job-search.service'
import { SEARCH_CANDIDATE_LIMIT, SearchPublicJobsParams, SemanticSearchResult } from './job-search.type'

class SemanticJobSearchService {
  async search(params: SearchPublicJobsParams): Promise<SemanticSearchResult> {
    const queryText = params.q?.trim()

    if (!queryText) {
      return {
        hits: [],
        embeddingElapsedMs: 0,
        semanticSearchElapsedMs: 0
      }
    }

    const embeddingStartedAt = performance.now()
    const queryVector = await generateLocalEmbedding(queryText)
    const embeddingElapsedMs = performance.now() - embeddingStartedAt

    const semanticSearchStartedAt = performance.now()
    const response = await ElasticsearchConfig.getInstance().search({
      index: env.PUBLIC_JOBS_SEARCH_INDEX,
      size: SEARCH_CANDIDATE_LIMIT,
      query: {
        script_score: {
          query: {
            bool: {
              filter: lexicalJobSearchService.buildPublicSearchFilters(params)
            }
          },
          script: {
            source: "cosineSimilarity(params.queryVector, 'embedding') + 1.0",
            params: {
              queryVector
            }
          }
        }
      }
    })
    const semanticSearchElapsedMs = performance.now() - semanticSearchStartedAt

    return {
      hits: response.hits.hits.map((hit) => ({
        job_id: String(hit._id),
        score: hit._score || 0
      })),
      embeddingElapsedMs,
      semanticSearchElapsedMs
    }
  }
}

const semanticJobSearchService = new SemanticJobSearchService()
export default semanticJobSearchService