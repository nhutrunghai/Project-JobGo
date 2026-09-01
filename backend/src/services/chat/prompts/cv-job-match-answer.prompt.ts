import { RetrievedChatJob, RetrievedResumeChunk } from '~/services/chat/types/chat.type'

const buildResumeContext = (chunks: RetrievedResumeChunk[]) =>
  chunks.length > 0
    ? chunks
        .map((chunk) =>
          [`Chunk ${chunk.chunk_index}:`, chunk.section ? `Section: ${chunk.section}` : '', chunk.text]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n\n---\n\n')
    : 'Khong co text chunks tu Elasticsearch cho CV nay.'

const buildJobsContext = (jobs: RetrievedChatJob[]) =>
  jobs
    .map(
      (job, index) => `Job ${index + 1}
- job_id: ${job.job_id}
- title: ${job.title}
- company: ${job.company}
- location: ${job.location}
- level: ${job.level}
- job_type: ${job.job_type}
- skills: ${job.skills.join(', ') || 'Khong co'}
- description: ${job.description || 'Khong co'}
- requirements: ${job.requirements || 'Khong co'}
- benefits: ${job.benefits || 'Khong co'}`
    )
    .join('\n\n')

export const buildCvJobMatchJsonAnswerPrompt = ({
  message,
  chunks,
  jobs,
  matchMode
}: {
  message: string
  chunks: RetrievedResumeChunk[]
  jobs: RetrievedChatJob[]
  matchMode: 'search_all_jobs' | 'previous_jobs'
}) => `
Ban la chatbot tu van muc do phu hop giua CV ung vien va job tren JobGo.
Chi duoc dung CV context va Jobs context ben duoi. Khong bia them ky nang, kinh nghiem hoac job ngoai context.

Che do:
${matchMode === 'previous_jobs' ? 'Chi danh gia cac job da duoc nhac/tim truoc do trong Jobs context.' : 'Goi y job phu hop nhat tu Jobs context da duoc truy xuat theo CV.'}

Yeu cau cua user:
${message}

CV context:
${buildResumeContext(chunks)}

Jobs context:
${buildJobsContext(jobs)}

Hay tra ve JSON hop le theo schema.
- answer: cau tra loi tieng Viet cho user. Neu user yeu cau so luong cu the, hay neu toi da dung so luong do neu Jobs context co du. Neu khong, neu cac job phu hop nhat, ly do khop, diem con thieu/rui ro va goi y cai thien CV neu can.
- selected_job_ids: danh sach job_id cua dung cac job duoc nhac/goi y trong answer.
- Neu du lieu CV thieu, phai noi ro muc danh gia chi la tuong doi.
- Khong dua job_id vao selected_job_ids neu job do khong duoc nhac trong answer.
- selected_job_ids chi duoc dung job_id co trong Jobs context.
`.trim()
