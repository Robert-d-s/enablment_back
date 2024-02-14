// import { Field, ObjectType } from '@nestjs/graphql';

// @ObjectType()
// export class LinearTeamDTO {
//   @Field(() => String)
//   id: string;

//   @Field(() => String)
//   createdAt: string;

//   @Field(() => String)
//   updatedAt: string;

//   @Field(() => String)
//   name: string;

//   @Field(() => String)
//   key: string;

//   @Field(() => String, { nullable: true })
//   description: string | null;
// }

// // Define TeamsDTO next as it depends on TeamDTO
// @ObjectType()
// export class LinearTeamsDTO {
//   @Field(() => [LinearTeamDTO])
//   nodes: LinearTeamDTO[];
// }

// // UserDTO comes next as it depends on TeamsDTO
// @ObjectType()
// export class UserDTO {
//   @Field(() => String)
//   id: string;

//   @Field(() => String)
//   createdAt: string;

//   @Field(() => String)
//   updatedAt: string;

//   @Field(() => String)
//   name: string;

//   @Field(() => String)
//   displayName: string;

//   @Field(() => String)
//   email: string;

//   @Field(() => String, { nullable: true })
//   avatarUrl: string | null;

//   @Field(() => String, { nullable: true })
//   lastSeen: string | null;

//   @Field(() => LinearTeamsDTO)
//   teams: LinearTeamsDTO;
// }

// // Define UsersDTO as it depends on UserDTO
// @ObjectType()
// export class UsersDTO {
//   @Field(() => [UserDTO])
//   nodes: UserDTO[];
// }

// //define OrganizationDTO and OrganizationResponse
// @ObjectType()
// export class OrganizationDTO {
//   @Field(() => String)
//   id: string;

//   @Field(() => String)
//   createdAt: string;

//   @Field(() => String)
//   updatedAt: string;

//   @Field(() => String)
//   name: string;

//   @Field(() => UsersDTO)
//   users: UsersDTO;
// }

// @ObjectType()
// export class OrganizationResponse {
//   @Field(() => OrganizationDTO)
//   organization: OrganizationDTO;
// }
