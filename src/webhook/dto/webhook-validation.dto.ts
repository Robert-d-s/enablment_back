import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsObject,
  ValidateNested,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectWebhookDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  teamIds: string[];

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  state: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  targetDate?: string;
}

export class IssueAssigneeDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class IssueProjectDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class IssueStateDto {
  @IsString()
  id: string;

  @IsString()
  color: string;

  @IsString()
  name: string;

  @IsString()
  type: string;
}

export class IssueTeamDto {
  @IsString()
  id: string;

  @IsString()
  key: string;

  @IsString()
  name: string;
}

export class IssueLabelDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsString()
  parentId: string;
}

export class IssueWebhookDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  priorityLabel?: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ValidateNested()
  @Type(() => IssueAssigneeDto)
  @IsOptional()
  assignee?: IssueAssigneeDto;

  @ValidateNested()
  @Type(() => IssueProjectDto)
  @IsOptional()
  project?: IssueProjectDto;

  @ValidateNested()
  @Type(() => IssueStateDto)
  @IsOptional()
  state?: IssueStateDto;

  @ValidateNested()
  @Type(() => IssueTeamDto)
  @IsOptional()
  team?: IssueTeamDto;

  @ValidateNested({ each: true })
  @Type(() => IssueLabelDto)
  @IsArray()
  @IsOptional()
  labels?: IssueLabelDto[];

  @IsString()
  @IsOptional()
  projectName?: string;
}

export class LinearWebhookBodyDto {
  @IsIn(['create', 'remove', 'update'])
  action: 'create' | 'remove' | 'update';

  @IsIn(['Project', 'Issue'])
  type: 'Project' | 'Issue';

  @IsObject()
  @IsNotEmpty()
  data: ProjectWebhookDataDto | IssueWebhookDataDto;
}
