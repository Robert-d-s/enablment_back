import { Test, TestingModule } from '@nestjs/testing';
import { SanitizationService } from '../src/common/services/sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanitizationService],
    }).compile();

    service = module.get<SanitizationService>(SanitizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = service.sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle null and undefined', () => {
      expect(service.sanitizeText(null)).toBe('');
      expect(service.sanitizeText(undefined)).toBe('');
      expect(service.sanitizeText('')).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '   Hello World   ';
      const result = service.sanitizeText(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = service.sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove dangerous HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Hello</p>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove dangerous attributes', () => {
      const input = '<div onclick="alert(1)">Hello</div>';
      const result = service.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('sanitizeId', () => {
    it('should accept valid IDs', () => {
      const validIds = ['abc123', 'user-123', 'project_456'];
      validIds.forEach((id) => {
        expect(service.sanitizeId(id)).toBe(id);
      });
    });

    it('should reject invalid IDs', () => {
      const invalidIds = ['<script>', 'user@domain', 'id with spaces'];
      invalidIds.forEach((id) => {
        expect(() => service.sanitizeId(id)).toThrow();
      });
    });

    it('should reject overly long IDs', () => {
      const longId = 'a'.repeat(256);
      expect(() => service.sanitizeId(longId)).toThrow();
    });
  });

  describe('sanitizeColor', () => {
    it('should accept valid hex colors', () => {
      const validColors = ['#FF0000', '#00ff00', '#123ABC'];
      validColors.forEach((color) => {
        expect(service.sanitizeColor(color)).toBe(color.toLowerCase());
      });
    });

    it('should accept short hex colors', () => {
      const color = '#F0A';
      expect(service.sanitizeColor(color)).toBe('#f0a');
    });

    it('should reject invalid colors', () => {
      const invalidColors = ['red', '#GG0000', 'javascript:alert(1)'];
      invalidColors.forEach((color) => {
        expect(() => service.sanitizeColor(color)).toThrow();
      });
    });
  });

  describe('sanitizeLinearIssue', () => {
    it('should sanitize issue data', () => {
      const issue = {
        id: 'issue-123',
        title: '<script>alert("xss")</script>Issue Title',
        description: '<p>Description with <strong>formatting</strong></p>',
        identifier: 'ABC-123',
        priorityLabel: 'High',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        assignee: {
          id: 'user-123',
          name: '<script>alert("name")</script>John Doe',
        },
        state: {
          id: 'state-1',
          name: 'In Progress',
          color: '#FF0000',
          type: 'started',
        },
      };

      const result = service.sanitizeLinearIssue(issue);

      expect(result.id).toBe('issue-123');
      expect(result.title).toBe('Issue Title'); // XSS removed
      expect(result.description).toContain('<p>'); // Safe HTML preserved
      expect(result.assignee?.name).toBe('John Doe'); // XSS removed
      expect(result.state?.color).toBe('#ff0000'); // Color normalized
    });

    it('should handle missing optional fields', () => {
      const issue = {
        id: 'issue-123',
        title: 'Simple Issue',
        identifier: 'ABC-123',
      };

      const result = service.sanitizeLinearIssue(issue);

      expect(result.id).toBe('issue-123');
      expect(result.assignee).toBeNull();
      expect(result.project).toBeNull();
      expect(result.labels).toEqual([]);
    });
  });

  describe('sanitizeLinearTeam', () => {
    it('should sanitize team data', () => {
      const team = {
        id: 'team-123',
        name: '<script>alert("team")</script>Development Team',
        key: 'DEV',
      };

      const result = service.sanitizeLinearTeam(team);

      expect(result.id).toBe('team-123');
      expect(result.name).toBe('Development Team');
      expect(result.key).toBe('DEV');
    });
  });
});
