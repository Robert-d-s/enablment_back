import {
    Args,
    Mutation,
    Query,
    Resolver,
} from '@nestjs/graphql';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserInputCreate } from './user.input';

@Resolver(() => User)
export class UserResolver {
    constructor(private userService: UserService) {}

    @Query(() => [User])
    async users(): Promise<User[]> {
        return this.userService.all();
    }

    @Mutation(() => User)
    async createUser(
        @Args('userInputCreate') userInputCreate: UserInputCreate,
    ): Promise<User> {
        return this.userService.create(userInputCreate.email, userInputCreate.password)
    }
}