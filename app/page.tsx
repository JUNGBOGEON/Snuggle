export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="text-xl font-bold text-black dark:text-white">
            Snuggle
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-medium text-black dark:text-white"
            >
              홈
            </a>
            <a
              href="#"
              className="text-sm font-medium text-black/60 dark:text-white/60"
            >
              피드
            </a>
            <a
              href="#"
              className="text-sm font-medium text-black/60 dark:text-white/60"
            >
              스킨
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="검색"
              className="h-9 w-48 rounded-full border border-black/10 bg-transparent px-4 text-sm text-black placeholder-black/40 outline-none dark:border-white/10 dark:text-white dark:placeholder-white/40"
            />
            <button
              type="button"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              시작하기
            </button>
          </div>
        </div>
      </header>

      {/* Main Section - Empty */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Content will be added here */}
      </main>
    </div>
  );
}
