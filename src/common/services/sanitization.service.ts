import { Injectable } from '@nestjs/common';
import * as validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Define interfaces for Linear data structures
interface LinearAssignee {
  id: string;
  name: string;
}

interface LinearProject {
  id: string;
  name: string;
}

interface LinearState {
  id: string;
  name: string;
  color: string;
  type: string;
}

interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

interface LinearLabel {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
}

interface LinearIssueInput {
  id?: string;
  title?: string;
  description?: string;
  identifier?: string;
  priorityLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string | null;
  assignee?: LinearAssignee | null;
  project?: LinearProject | null;
  state?: LinearState | null;
  team?: LinearTeam | null;
  labels?: { nodes: LinearLabel[] } | null;
}

interface LinearTeamInput {
  id?: string;
  name?: string;
  key?: string;
}

interface LinearProjectInput {
  id?: string;
  name?: string;
  description?: string;
  state?: string;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  teamIds?: string[];
}

// Define sanitized return types
interface SanitizedLinearIssue {
  id: string;
  title: string;
  description: string;
  identifier: string;
  priorityLabel: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  dueDate: Date | null;
  assignee: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  state: { id: string; name: string; color: string; type: string } | null;
  team: { id: string; key: string; name: string } | null;
  labels: Array<{
    id: string;
    name: string;
    color: string;
    parentId: string | null;
  }>;
}

interface SanitizedLinearTeam {
  id: string;
  name: string;
  key: string;
}

interface SanitizedLinearProject {
  id: string;
  name: string;
  description: string;
  state: string;
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  teamIds: string[];
}

@Injectable()
export class SanitizationService {
  constructor() {}

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string | null | undefined): string {
    if (!input) return '';

    // First trim whitespace
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Sanitize HTML content with DOMPurify
    return DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'ul',
        'ol',
        'li',
      ],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Sanitize plain text content (no HTML allowed)
   */
  sanitizeText(input: string | null | undefined): string {
    if (!input) return '';

    const trimmed = input.trim();
    if (!trimmed) return '';

    // Strip all HTML and sanitize with DOMPurify
    return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
  }

  /**
   * Validate and sanitize an ID field
   */
  sanitizeId(input: string | null | undefined): string {
    if (!input) return '';

    const trimmed = input.trim();

    // Basic ID validation - alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new Error(`Invalid ID format: ${trimmed}`);
    }

    // Length check
    if (trimmed.length > 255) {
      throw new Error(`ID too long: ${trimmed.length} characters`);
    }

    return trimmed;
  }

  /**
   * Validate and sanitize an email address
   */
  sanitizeEmail(input: string | null | undefined): string {
    if (!input) return '';

    const trimmed = input.trim().toLowerCase();

    if (!validator.isEmail(trimmed)) {
      throw new Error(`Invalid email format: ${trimmed}`);
    }

    return trimmed;
  }

  /**
   * Validate and sanitize a date string
   */
  sanitizeDate(input: string | null | undefined): Date | null {
    if (!input) return null;

    const trimmed = input.trim();
    if (!trimmed) return null;

    // Validate ISO date format
    if (!validator.isISO8601(trimmed)) {
      throw new Error(`Invalid date format: ${trimmed}`);
    }

    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${trimmed}`);
    }

    return date;
  }

  /**
   * Sanitize a string with length validation
   */
  sanitizeString(input: string | null | undefined, maxLength = 1000): string {
    if (!input) return '';

    const sanitized = this.sanitizeText(input);

    if (sanitized.length > maxLength) {
      throw new Error(
        `String too long: ${sanitized.length} characters (max: ${maxLength})`,
      );
    }

    return sanitized;
  }

  /**
   * Sanitize a URL
   */
  sanitizeUrl(input: string | null | undefined): string {
    if (!input) return '';

    const trimmed = input.trim();

    if (!validator.isURL(trimmed, { protocols: ['http', 'https'] })) {
      throw new Error(`Invalid URL format: ${trimmed}`);
    }

    return trimmed;
  }

  /**
   * Sanitize a hex color code
   */
  sanitizeColor(input: string | null | undefined): string {
    if (!input) return '';

    const trimmed = input.trim();

    // Validate hex color format (#RRGGBB or #RGB)
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(trimmed)) {
      throw new Error(`Invalid color format: ${trimmed}`);
    }

    return trimmed.toLowerCase();
  }

  /**
   * Sanitize Linear-specific data structures
   */
  sanitizeLinearIssue(issue: LinearIssueInput): SanitizedLinearIssue {
    return {
      id: this.sanitizeId(issue?.id),
      title: this.sanitizeString(issue?.title, 500),
      description: this.sanitizeHtml(issue?.description),
      identifier: this.sanitizeString(issue?.identifier, 50),
      priorityLabel: this.sanitizeString(issue?.priorityLabel, 100),
      createdAt: this.sanitizeDate(issue?.createdAt),
      updatedAt: this.sanitizeDate(issue?.updatedAt),
      dueDate: this.sanitizeDate(issue?.dueDate),
      assignee: issue?.assignee
        ? {
            id: this.sanitizeId(issue.assignee.id),
            name: this.sanitizeString(issue.assignee.name, 200),
          }
        : null,
      project: issue?.project
        ? {
            id: this.sanitizeId(issue.project.id),
            name: this.sanitizeString(issue.project.name, 200),
          }
        : null,
      state: issue?.state
        ? {
            id: this.sanitizeId(issue.state.id),
            name: this.sanitizeString(issue.state.name, 100),
            color: this.sanitizeColor(issue.state.color),
            type: this.sanitizeString(issue.state.type, 50),
          }
        : null,
      team: issue?.team
        ? {
            id: this.sanitizeId(issue.team.id),
            key: this.sanitizeString(issue.team.key, 50),
            name: this.sanitizeString(issue.team.name, 200),
          }
        : null,
      labels: issue?.labels?.nodes
        ? issue.labels.nodes.map((label: LinearLabel) => ({
            id: this.sanitizeId(label.id),
            name: this.sanitizeString(label.name, 100),
            color: this.sanitizeColor(label.color),
            parentId: label.parentId ? this.sanitizeId(label.parentId) : null,
          }))
        : [],
    };
  }

  /**
   * Sanitize Linear team data
   */
  sanitizeLinearTeam(team: LinearTeamInput): SanitizedLinearTeam {
    return {
      id: this.sanitizeId(team?.id),
      name: this.sanitizeString(team?.name, 200),
      key: this.sanitizeString(team?.key, 50),
    };
  }

  /**
   * Sanitize Linear project data
   */
  sanitizeLinearProject(project: LinearProjectInput): SanitizedLinearProject {
    return {
      id: this.sanitizeId(project?.id),
      name: this.sanitizeString(project?.name, 200),
      description: this.sanitizeHtml(project?.description),
      state: this.sanitizeString(project?.state, 50),
      startDate: this.sanitizeDate(project?.startDate),
      targetDate: this.sanitizeDate(project?.targetDate),
      createdAt: this.sanitizeDate(project?.createdAt),
      updatedAt: this.sanitizeDate(project?.updatedAt),
      teamIds: project?.teamIds
        ? project.teamIds.map((id: string) => this.sanitizeId(id))
        : [],
    };
  }
}
