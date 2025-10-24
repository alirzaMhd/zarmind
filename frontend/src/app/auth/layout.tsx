import React from 'react';

// This layout now simply passes its children through.
// The login page itself will control the full-screen split layout.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}