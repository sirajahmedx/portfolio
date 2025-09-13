export async function GET(req: Request) {
  const res = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  if (!res.ok) {
    return new Response('Failed to fetch repos', { status: res.status });
  }

  const repos = await res.json();
  const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);
  return Response.json({ stars: totalStars });
}