import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[#3f3f3f] bg-[#1a1a1a]">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[#e5e5e5] transition-colors hover:text-white"
        >
          Turing Touring
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
          >
            Home
          </Link>
          <Link
            href="/vlm"
            className="text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
          >
            VLM
          </Link>
          <Link
            href="/walking-tour"
            className="text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
          >
            Walking Tour
          </Link>
          <Link
            href="/talking-tour"
            className="text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
          >
            Talking Tour
          </Link>
          <Link
            href="/chat"
            className="text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
          >
            Chat
          </Link>
        </div>
      </nav>
    </header>
  );
}
