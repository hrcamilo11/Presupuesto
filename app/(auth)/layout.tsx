export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}
