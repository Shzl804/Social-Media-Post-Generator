import PostForm from "@/components/PostForm";

export default function Home() {
  return (
    <main className="light-mode-gradient min-h-screen flex-1 bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <PostForm />
      </div>
    </main>
  );
}
