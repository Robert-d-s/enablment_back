import { Query, Resolver, Context } from '@nestjs/graphql';
import { ProjectLoader } from '../../loaders/project.loader';
import { TeamLoader } from '../../loaders/team.loader';
import { Project } from '../../project/project.model';
import { UnauthorizedException } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { GqlContext } from '../../app.module';

@Resolver()
export class UserProjectsResolver {
  constructor(
    @InjectPinoLogger(UserProjectsResolver.name)
    private readonly logger: PinoLogger,
    private teamLoader: TeamLoader,
    private projectLoader: ProjectLoader,
  ) {}

  @Query(() => [Project])
  async myProjects(@Context() context: GqlContext): Promise<Project[]> {
    const currentUser = context.req.user;
    if (!currentUser) throw new UnauthorizedException('No user in request');
    this.logger.debug({ userId: currentUser.id }, 'Executing myProjects query');

    const userTeams = await this.teamLoader.byUserId.load(currentUser.id);
    if (!userTeams || userTeams.length === 0) {
      return [];
    }

    const teamIds = userTeams.map((team) => team.id);
    const projectsPerTeam = (await this.projectLoader.byTeamId.loadMany(
      teamIds,
    )) as Array<Project[] | Error | null>;

    const teamNameMap = new Map<string, string>();
    userTeams.forEach((team) => {
      teamNameMap.set(team.id, team.name);
    });

    const validProjectArrays: Project[] = [];
    projectsPerTeam.forEach((res, idx) => {
      const teamId = teamIds[idx];
      if (res instanceof Error) {
        this.logger.warn(
          { teamId, err: res },
          'Error loading projects for team',
        );
      } else if (res && Array.isArray(res)) {
        validProjectArrays.push(...res);
      }
    });

    // Process and enrich projects with team names
    const allProjects = validProjectArrays.map((project) => ({
      ...project,
      teamName: teamNameMap.get(project.teamId) || 'Unknown Team',
    }));

    this.logger.debug(
      {
        userId: currentUser.id,
        teamCount: userTeams.length,
        projectCount: allProjects.length,
      },
      'Successfully loaded user projects',
    );

    return allProjects;
  }
}
