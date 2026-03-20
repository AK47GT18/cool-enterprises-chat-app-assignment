"use client";

import { useEffect } from "react";
import { setupAuthInterceptor } from "@/lib/auth-interceptor";

export default function AuthInterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupAuthInterceptor();
  }, []);

  return <>{children}</>;
}
