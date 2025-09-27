export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overflow-hidden">{children}</div>;
}
