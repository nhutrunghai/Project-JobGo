import { JwtPayload } from 'jsonwebtoken'
import { UserRole } from '~/constants/enums.js'

export default interface UserInfo extends JwtPayload {
  userId: string
  jti: string
  role: UserRole
  typeJwt: string
  vfd: boolean
  remember?: boolean
}
