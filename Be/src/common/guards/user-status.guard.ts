import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { ERROR_MESSAGES } from "../constants";
import { IS_PUBLIC_KEY } from "../decorators";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserStatusGuard implements CanActivate {
	private readonly logger = new Logger(UserStatusGuard.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
		if(isPublic) {
			return true;
		}

		const user = request.user;		
		if(!user || !user.userId){
			return true;
		}

		const  dbUser = await this.prisma.user.findUnique({
			where: {
				id: user.userId,
			}
		});
		if(dbUser && dbUser.status === UserStatus.DEACTIVE) {
			this.logger.warn(`User ${user.userId} is deactive`);
			throw new ForbiddenException(ERROR_MESSAGES.AUTH.USER_DEACTIVE);
		}
		return true;
	}

}