import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseService {
  async CustomPagination(page: number, limit: number, model?: any) {
    const take = limit;
    const skip = limit * (page - 1);
    return model.findMany({
      skip,
      take,
    });
  }
}
