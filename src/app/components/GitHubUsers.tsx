
type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
};

// Server component: fetch a small list of GitHub users and render them
export default async function GitHubUsers() {
  const res = await fetch('https://api.github.com/users?per_page=6', {
    // cache for 1 hour to avoid hitting rate limits during development
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'Crud-simples-app' },
  });

  if (!res.ok) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-black mb-4">Usuários do GitHub</h2>
        <p className="text-sm text-gray-600">Não foi possível carregar dados do GitHub (HTTP {res.status}).</p>
      </section>
    );
  }

  const users = (await res.json()) as GitHubUser[];

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold text-black mb-6">Usuários do GitHub</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {users.map((u) => (
          <li key={u.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4 border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u.avatar_url}
              alt={u.login}
              className="w-12 h-12 rounded-full border"
              width={48}
              height={48}
            />
            <div className="min-w-0">
              <a
                href={u.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline truncate block"
                title={u.login}
              >
                @{u.login}
              </a>
              <span className="text-xs text-gray-500">Perfil público</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
