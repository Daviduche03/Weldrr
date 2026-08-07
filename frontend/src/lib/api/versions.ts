import { http } from '@/lib/http'
import type { ArtifactVersion } from '@/lib/types'

export const versionApi = {
  list: (projectId: string): Promise<ArtifactVersion[]> =>
    http.get<ArtifactVersion[]>(`/api/projects/${projectId}/versions`),
}
