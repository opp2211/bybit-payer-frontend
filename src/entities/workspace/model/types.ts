export type WorkspaceRole = 'OWNER' | 'MEMBER'

export type Workspace = {
  publicId: string
  name: string
  ownerPublicId: string
  ownerUsername: string
  currentUserRole: WorkspaceRole
  bybitP2pAdId: string
  bybitNickname: string | null
  receiptEmail: string | null
  imapHost: string | null
  imapPort: number | null
  imapUsername: string | null
  enabled: boolean
  createdAt: string
}

export type WorkspaceMember = {
  userPublicId: string
  username: string
  email: string
  role: WorkspaceRole
  createdAt: string
}

export type CreateWorkspaceRequest = {
  name: string
  bybitApiKey: string
  bybitApiSecret: string
  bybitP2pAdId: string
  receiptEmail?: string
  imapHost: string
  imapPort: number
  imapUsername: string
  imapPassword: string
}

export type AddWorkspaceMemberRequest = {
  lookup: string
}
