import { ReactNode } from "react";
import SurfacePanel from "@/layout/SurfacePanel";

interface PageContentProps {
  children: ReactNode;
}

export function PageContent({ children }: PageContentProps) {
  return (
    <SurfacePanel
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      {children}
    </SurfacePanel>
  );
}
