export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}