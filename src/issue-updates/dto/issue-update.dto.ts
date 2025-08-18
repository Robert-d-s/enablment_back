export interface IssueUpdateMessage {
  id: string;
  action: 'create' | 'update' | 'remove';
  title?: string;
  state?: string;
  assigneeName?: string;
  priorityLabel?: string;
  teamName?: string;
  labels?: Array<{
    id: string;
    name: string;
    color: string;
    parentId?: string;
  }>;
  projectId?: string;
  projectName?: string;
  identifier?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebSocketConnectionInfo {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

export interface BroadcastOptions {
  room?: string;
  excludeClient?: string;
  includeMetadata?: boolean;
}
