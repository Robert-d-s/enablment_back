export const ISSUE_CONSTANTS = {
  DEFAULT_VALUES: {
    PRIORITY: 'No Priority',
    ASSIGNEE: 'No Assignee',
    PROJECT_NAME: 'Unknown Project',
  },
  VALIDATION: {
    MIN_TITLE_LENGTH: 1,
    MAX_TITLE_LENGTH: 500,
    MAX_IDENTIFIER_LENGTH: 50,
  },
  ERRORS: {
    PROJECT_ID_REQUIRED: 'ProjectId is required to create an issue',
    TITLE_REQUIRED: 'Title is required',
    IDENTIFIER_REQUIRED: 'Identifier is required',
    INVALID_TITLE_LENGTH: 'Title must be between 1 and 500 characters',
    INVALID_IDENTIFIER_LENGTH: 'Identifier must not exceed 50 characters',
  },
} as const;
