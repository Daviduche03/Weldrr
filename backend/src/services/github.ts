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
  init?: { method?: string; body?: string },
): Promise<unknown> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'weldrr',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
    ...(init?.body ? { body: init.body } : {}),
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

export type RepoTreeNode = {
  path: string
  type: 'tree' | 'blob'
  sha: string
}

export async function getRepoDefaultBranch(
  accessToken: string,
  fullName: string,
): Promise<string> {
  const data = (await githubRequest(`/repos/${fullName}`, accessToken)) as {
    default_branch?: string
  }
  return data.default_branch ?? 'main'
}

export async function listRepoTree(
  accessToken: string,
  fullName: string,
  branch = 'main',
): Promise<RepoTreeNode[]> {
  const data = (await githubRequest(
    `/repos/${fullName}/git/trees/${branch}?recursive=1`,
    accessToken,
  )) as { tree?: Array<{ path?: string; type?: string; sha?: string }> }
  return (data.tree ?? [])
    .filter((x) => x.path && x.sha)
    .map((x) => ({
      path: x.path as string,
      type: x.type === 'tree' ? ('tree' as const) : ('blob' as const),
      sha: x.sha as string,
    }))
}

export async function readRepoFile(
  accessToken: string,
  fullName: string,
  path: string,
  branch?: string,
): Promise<string> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : ''
  const data = (await githubRequest(
    `/repos/${fullName}/contents/${encodePath(path)}${ref}`,
    accessToken,
  )) as { content?: string; encoding?: string }

  if (typeof data.content !== 'string') {
    throw new AppError(502, `GitHub returned no content for "${path}"`)
  }
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return data.content
}

export type WriteFileInput = {
  path: string
  content: string
  message?: string
  branch?: string
  /** Defaults to utf-8. Use 'base64' for binary assets (images). */
  encoding?: 'utf-8' | 'base64'
}

export async function writeRepoFile(
  accessToken: string,
  fullName: string,
  input: WriteFileInput,
): Promise<void> {
  const branch = input.branch ?? 'main'
  const message = input.message ?? `docs: update ${input.path}`
  const encoding = input.encoding ?? 'utf-8'

  const current = await getRepoRef(accessToken, fullName, branch)

  const blobData = (await githubRequest(
    `/repos/${fullName}/git/blobs`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        content: input.content,
        encoding,
      }),
    },
  )) as { sha: string }

  const commitData0 = (await githubRequest(
    `/repos/${fullName}/git/commits/${current.commitSha}`,
    accessToken,
  )) as { tree?: { sha?: string } }
  const baseTreeSha = commitData0.tree?.sha ?? current.commitSha

  const treeData = (await githubRequest(
    `/repos/${fullName}/git/trees`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [{ path: input.path, mode: '100644', type: 'blob', sha: blobData.sha }],
      }),
    },
  )) as { sha: string }

  const commitData = (await githubRequest(
    `/repos/${fullName}/git/commits`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [current.commitSha],
      }),
    },
  )) as { sha: string }

  await githubRequest(`/repos/${fullName}/git/refs/heads/${branch}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitData.sha, force: false }),
  })
}

export async function deleteRepoFile(
  accessToken: string,
  fullName: string,
  path: string,
  message = `docs: delete ${path}`,
  branch = 'main',
): Promise<void> {
  // GitHub's contents DELETE requires the current blob sha.
  const current = (await githubRequest(
    `/repos/${fullName}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    accessToken,
  )) as { sha?: string }
  if (!current.sha) {
    throw new AppError(404, `File "${path}" not found in ${fullName}`)
  }

  const res = await fetch(`${GITHUB_API}/repos/${fullName}/contents/${encodePath(path)}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'weldrr',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message, sha: current.sha, branch }),
    signal: AbortSignal.timeout(15_000),
  })

  if (res.status === 401 || res.status === 403) {
    throw new AppError(401, 'GitHub connection expired — please reconnect')
  }
  if (!res.ok) {
    throw new AppError(502, `GitHub API returned HTTP ${res.status}`)
  }
}

async function getRepoRef(
  accessToken: string,
  fullName: string,
  branch: string,
): Promise<{ commitSha: string }> {
  const data = (await githubRequest(
    `/repos/${fullName}/git/ref/heads/${branch}`,
    accessToken,
  )) as { object?: { sha?: string } }
  if (!data.object?.sha) {
    throw new AppError(502, `Could not resolve branch "${branch}" for ${fullName}`)
  }
  return { commitSha: data.object.sha }
}

export async function createBranch(
  accessToken: string,
  fullName: string,
  branch: string,
  baseBranch = 'main',
): Promise<void> {
  const base = await getRepoRef(accessToken, fullName, baseBranch)
  await githubRequest(`/repos/${fullName}/git/refs`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.commitSha }),
  })
}

export async function branchExists(
  accessToken: string,
  fullName: string,
  branch: string,
): Promise<boolean> {
  try {
    await getRepoRef(accessToken, fullName, branch)
    return true
  } catch {
    return false
  }
}

export type PullRequestInfo = {
  number: number
  htmlUrl: string
  state: string
  merged: boolean
  headSha: string
}

export async function openPullRequest(
  accessToken: string,
  fullName: string,
  input: {
    head: string
    base?: string
    title: string
    body?: string
  },
): Promise<PullRequestInfo> {
  const data = (await githubRequest(`/repos/${fullName}/pulls`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      head: input.head,
      base: input.base ?? 'main',
      body: input.body ?? '',
    }),
  })) as {
    number: number
    html_url: string
    state: string
    merged?: boolean
    head?: { sha?: string }
  }
  return {
    number: data.number,
    htmlUrl: data.html_url,
    state: data.state,
    merged: data.merged ?? false,
    headSha: data.head?.sha ?? '',
  }
}

export async function getPullRequest(
  accessToken: string,
  fullName: string,
  number: number,
): Promise<PullRequestInfo> {
  const data = (await githubRequest(`/repos/${fullName}/pulls/${number}`, accessToken)) as {
    number: number
    html_url: string
    state: string
    merged?: boolean
    head?: { sha?: string }
  }
  return {
    number: data.number,
    htmlUrl: data.html_url,
    state: data.state,
    merged: data.merged ?? false,
    headSha: data.head?.sha ?? '',
  }
}

export async function mergePullRequest(
  accessToken: string,
  fullName: string,
  number: number,
): Promise<{ merged: boolean; sha?: string }> {
  const data = (await githubRequest(`/repos/${fullName}/pulls/${number}/merge`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ merge_method: 'squash' }),
  })) as { merged?: boolean; sha?: string }
  return { merged: data.merged ?? false, sha: data.sha }
}

export async function createTag(
  accessToken: string,
  fullName: string,
  tag: string,
  commitSha: string,
  message?: string,
): Promise<void> {
  const tagData = (await githubRequest(`/repos/${fullName}/git/tags`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      tag,
      message: message ?? tag,
      object: commitSha,
      type: 'commit',
    }),
  })) as { sha: string }

  await githubRequest(`/repos/${fullName}/git/refs`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/tags/${tag}`, sha: tagData.sha }),
  })
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}
