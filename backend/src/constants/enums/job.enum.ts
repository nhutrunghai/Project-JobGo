export enum JobStatus {
  DRAFT = 'draft', // Ban nhap
  OPEN = 'open', // Dang tuyen
  PAUSED = 'paused', // Tam dung
  CLOSED = 'closed', // Da dong
  EXPIRED = 'expired' // Het han
}

export enum JobModerationStatus {
  ACTIVE = 'active', // Hien thi binh thuong
  BLOCKED = 'blocked' // Bi admin chan
}

export enum JobPromotionType {
  HOMEPAGE_FEATURED = 'homepage_featured'
}

export enum JobPromotionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum JobPromotionSource {
  EMPLOYER_PURCHASE = 'employer_purchase',
  ADMIN_GRANT = 'admin_grant'
}

export enum JobType {
  FULL_TIME = 'full-time', // Toan thoi gian
  PART_TIME = 'part-time', // Ban thoi gian
  INTERNSHIP = 'internship', // Thuc tap
  CONTRACT = 'contract', // Hop dong
  REMOTE = 'remote' // Tu xa
}

export enum JobLevel {
  INTERN = 'intern', // Thuc tap sinh
  FRESHER = 'fresher', // Moi ra truong
  JUNIOR = 'junior', // Co ban
  MIDDLE = 'middle', // Trung cap
  SENIOR = 'senior', // Cao cap
  LEAD = 'lead', // Dan dat nhom nho
  MANAGER = 'manager' // Quan ly
}

export enum JobApplicationStatus {
  SUBMITTED = 'submitted', // Da nop ho so
  REVIEWING = 'reviewing', // Dang xem xet
  SHORTLISTED = 'shortlisted', // Da vao danh sach tot
  INTERVIEWING = 'interviewing', // Dang phong van
  REJECTED = 'rejected', // Bi tu choi
  HIRED = 'hired', // Da duoc nhan
  WITHDRAWN = 'withdrawn' // Tu rut ho so
}
