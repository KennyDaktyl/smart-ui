import { ReactNode } from "react";
import LoadingOverlay from "@/features/common/components/LoadingOverlay";
import { PageContent } from "./PageContent";

interface PageShellProps {
  header: ReactNode;
  tabs?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function PageShell({
  header,
  tabs,
  loading,
  children,
}: PageShellProps) {
  return (
    <>
      {header}
      {tabs}
      <PageContent>
        <LoadingOverlay loading={loading} keepChildrenMounted minHeight={260}>
          {children}
        </LoadingOverlay>
      </PageContent>
    </>
  );
}
