import { ReactNode } from "react";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";
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
        {loading ? <CenteredSpinner /> : children}
      </PageContent>
    </>
  );
}
