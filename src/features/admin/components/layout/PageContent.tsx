import { ReactNode } from "react";
import SurfacePanel from "@/layout/SurfacePanel";

interface PageContentProps {
  children: ReactNode;
}

export function PageContent({ children }: PageContentProps) {
  return <SurfacePanel>{children}</SurfacePanel>;
}
