import { sdkRepository } from '@/modules/sdks/sdk.repository'
import { AppError } from '@/middleware/errorHandler'
import type { NewSdk } from '@/modules/sdks/sdk.schema'

export const sdkService = {
  async list(
    userId: string,
    opts: {
      page: number
      limit: number
      status?: string
      language?: string
      sortBy: string
      sortOrder: string
    },
  ) {
    const offset = (opts.page - 1) * opts.limit
    const { data, total } = await sdkRepository.findAll({ ...opts, userId, offset })

    return {
      data,
      meta: {
        page: opts.page,
        limit: opts.limit,
        total,
        totalPages: Math.ceil(total / opts.limit),
      },
    }
  },

  async getById(userId: string, id: string) {
    const sdk = await sdkRepository.findById(id)
    if (!sdk || sdk.userId !== userId) throw new AppError(404, 'SDK not found')
    return sdk
  },

  async create(userId: string, data: Record<string, unknown>) {
    return sdkRepository.create(userId, data as NewSdk)
  },

  async update(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await sdkRepository.findById(id)
    if (!existing || existing.userId !== userId) throw new AppError(404, 'SDK not found')
    const updated = await sdkRepository.update(id, data as Partial<NewSdk>)
    if (!updated) throw new AppError(500, 'Failed to update SDK')
    return updated
  },

  async delete(userId: string, id: string) {
    const existing = await sdkRepository.findById(id)
    if (!existing || existing.userId !== userId) throw new AppError(404, 'SDK not found')
    await sdkRepository.delete(id)
  },
}
