import { Suspense } from "react";

export default function ShowcaseItemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Suspense>{children}</Suspense>;
}
