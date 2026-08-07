import { AppError } from '@/middleware/errorHandler'

const GITHUB_API = 'https://api.github.com'

export type GitHubRepo = {
  id: number
  fullName: string
  cloneUrl: string
  private: boolean
  defaultBranch: string
  description: string | null
  updatedAt: string
  language: string | null
  ownerAvatarUrl: string | null
}

export type GitHubUser = {
  id: number
  login: string
  name: string | null
  avatarUrl: string | null
}

async function githubRequest(
  path: string,
  accessToken: string,
): Promise<unknown> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'weldrr',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (res.status === 401 || res.status === 403) {
    throw new AppError(401, 'GitHub connection expired — please reconnect')
  }

  if (!res.ok) {
    throw new AppError(502, `GitHub API returned HTTP ${res.status}`)
  }

  return res.json()
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const data = (await githubRequest('/user', accessToken)) as {
    id: number
    login: string
    name?: string | null
    avatar_url?: string | null
  }
  return {
    id: data.id,
    login: data.login,
    name: data.name ?? data.login,
    avatarUrl: data.avatar_url ?? null,
  }
}

export async function listGitHubRepos(
  accessToken: string,
  opts: { perPage?: number; page?: number; query?: string } = {},
): Promise<GitHubRepo[]> {
  const perPage = opts.perPage ?? 100
  const page = opts.page ?? 1
  const search = opts.query?.trim()

  if (search) {
    const data = (await githubRequest(
      `/search/repositories?q=${encodeURIComponent(`user:@me ${search}`)}&per_page=${perPage}&page=${page}`,
      accessToken,
    )) as { items: RepoRaw[] }
    return data.items.map(mapRepo)
  }

  const data = (await githubRequest(
    `/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator`,
    accessToken,
  )) as RepoRaw[]
  return data.map(mapRepo)
}

type RepoRaw = {
  id: number
  full_name: string
  clone_url: string
  private: boolean
  default_branch: string
  description?: string | null
  updated_at: string
  language?: string | null
  owner?: { avatar_url?: string | null }
}

function mapRepo(raw: RepoRaw): GitHubRepo {
  return {
    id: raw.id,
    fullName: raw.full_name,
    cloneUrl: raw.clone_url,
    private: raw.private,
    defaultBranch: raw.default_branch,
    description: raw.description ?? null,
    updatedAt: raw.updated_at,
    language: raw.language ?? null,
    ownerAvatarUrl: raw.owner?.avatar_url ?? null,
  }
}

export async function createGitHubRepo(
  accessToken: string,
  input: {
    name: string
    description?: string
    private: boolean
  },
): Promise<{ fullName: string; cloneUrl: string; htmlUrl: string }> {
  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'weldrr',
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? 'Generated SDK by Weldrr',
      private: input.private,
      // Empty repo — the agent's `git push` of `main` becomes the default branch.
      auto_init: false,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (res.status === 422) {
    throw new AppError(409, `GitHub repo "${input.name}" already exists`)
  }
  if (!res.ok) {
    throw new AppError(502, `GitHub could not create repo (HTTP ${res.status})`)
  }

  const data = (await res.json()) as {
    full_name: string
    clone_url: string
    html_url: string
  }
  return { fullName: data.full_name, cloneUrl: data.clone_url, htmlUrl: data.html_url }
}
