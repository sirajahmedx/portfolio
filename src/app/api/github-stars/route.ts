export async function GET(req: Request) {
  const res = await fetch('https://api.github.com/repos/sirajahmedx/portfolio', {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  if (!res.ok) {
    return new Response('Failed to fetch repo', { status: res.status });
  }

  const repo = await res.json();
  return Response.json({ stars: repo.stargazers_count });
}