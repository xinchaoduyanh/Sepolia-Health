import { PaginationResultDto } from '../dto/pagination-result.dto';

export async function paginate<Model, Args>(
  model: {
    findMany(args?: Args): Promise<Model[]>;
    count(args?: { where?: any }): Promise<number>;
  },
  page: number,
  limit: number,
  options?: Args,
): Promise<PaginationResultDto<Model>> {
  const take = limit;
  const skip = take * (page - 1);

  const total = await model.count({ where: (options as any)?.where });
  const data = await model.findMany({
    ...options,
    take,
    skip,
  } as Args);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
