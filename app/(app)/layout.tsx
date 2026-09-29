import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-top mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
      <main className="flex flex-1 flex-col pb-[calc(var(--safe-bottom)+7rem)]">{children}</main>
      <BottomTabBar />
    </div>
  );
}
