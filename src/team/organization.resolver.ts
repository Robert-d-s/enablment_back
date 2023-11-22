// organization.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';
import { OrganizationDTO } from './organization.dto';
import { LinearService } from './linear.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Resolver(() => OrganizationDTO)
export class OrganizationResolver {
  constructor(private readonly linearService: LinearService) {}

  @Query(() => OrganizationDTO)
  async getOrganization(): Promise<OrganizationDTO> {
    const observable = this.linearService.queryOrganization();
    console.log('Observable from LinearService:', observable);
    const result = await firstValueFrom(observable);
    console.log('Result from LinearService:', result);
    return result.organization;
  }
}
