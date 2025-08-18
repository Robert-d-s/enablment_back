export interface CreateIssueData {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  dueDate?: string | null;
  projectId: string;
  priorityLabel: string;
  identifier: string;
  assigneeName: string;
  projectName: string;
  state: string;
  teamName?: string | null;
  teamKey?: string | null;
}

export interface UpdateIssueData {
  createdAt: string;
  updatedAt: string;
  title: string;
  dueDate?: string;
  projectId?: string;
  priorityLabel: string;
  identifier: string;
  assigneeName: string;
  projectName: string;
  state?: string;
  teamName?: string;
  teamKey?: string | null;
}
