/** Full-viewport layout for the course player (no marketing navbar/footer). */
export default function LearnLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="min-h-screen bg-background">{children}</div>;
}
