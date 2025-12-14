import Link from 'next/link'

export default function AccessDenied() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <h2 className="whitespace-pre-wrap text-2xl font-bold leading-relaxed text-black dark:text-white md:text-3xl">
                권한이 없거나 존재하지 않는{'\n'}페이지입니다.
            </h2>

            <p className="mt-4 text-sm text-black/40 dark:text-white/40">
                궁금하신 사항은 <span className="font-medium underline underline-offset-4">고객센터</span>로 문의해 주시기 바랍니다.
            </p>

            <Link
                href="/"
                className="mt-8 rounded-full border border-black/10 bg-white px-8 py-3 text-sm font-medium text-black transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/5"
            >
                이전화면
            </Link>
        </div>
    )
}
