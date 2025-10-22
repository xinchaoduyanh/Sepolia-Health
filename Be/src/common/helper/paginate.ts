export async function paginate(
  model: any,
  page: number,
  limit: number,
  options: any = {},
) {
  const take = limit;
  const skip = take * (page - 1);

  const total = await model.count({ where: (options as any)?.where });
  const data = await model.findMany({
    ...options,
    take,
    skip,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
