import type {
  AddWorkspaceMemberRequest,
  CreateWorkspaceRequest,
  UpdateWorkspaceAiChatAgentRequest,
  Workspace,
  WorkspaceMember,
} from '@/entities/workspace/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const workspaceApi = {
  list: () => apiRequest<Workspace[]>('/api/workspaces'),
  create: (payload: CreateWorkspaceRequest) =>
    apiRequest<Workspace>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDetails: (workspacePublicId: string) =>
    apiRequest<Workspace>(`/api/workspaces/${workspacePublicId}`),
  updateAiChatAgent: (workspacePublicId: string, enabled: boolean) =>
    apiRequest<Workspace>(`/api/workspaces/${workspacePublicId}/ai-chat-agent`, {
      method: 'PUT',
      body: JSON.stringify({ enabled } satisfies UpdateWorkspaceAiChatAgentRequest),
    }),
  delete: (workspacePublicId: string) =>
    apiRequest<void>(`/api/workspaces/${workspacePublicId}`, {
      method: 'DELETE',
    }),
  listMembers: (workspacePublicId: string) =>
    apiRequest<WorkspaceMember[]>(`/api/workspaces/${workspacePublicId}/members`),
  addMember: (workspacePublicId: string, payload: AddWorkspaceMemberRequest) =>
    apiRequest<WorkspaceMember>(`/api/workspaces/${workspacePublicId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeMember: (workspacePublicId: string, userPublicId: string) =>
    apiRequest<void>(`/api/workspaces/${workspacePublicId}/members/${userPublicId}`, {
      method: 'DELETE',
    }),
}
