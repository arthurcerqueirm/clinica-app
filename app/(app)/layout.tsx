import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-top flex min-h-dvh flex-col bg-bg">
      <main className="flex flex-1 flex-col pb-24">{children}</main>
      <BottomTabBar />
    </div>
  );
}
