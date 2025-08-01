import React from "react";
import {
  Layout,
  current as layoutCurrent,
} from "@/components/ext/layout/publish.esensi";
import { MenuBarPublish } from "@/components/ext/menu-bar/publish";

interface PublishPageHeaderProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Publish Page Header Component
 * Provides the standard layout structure for publish.esensi pages
 * 
 * @param loading - Show loading state in layout
 * @param children - Content to render inside the main section
 * @param className - Custom class for the main content area
 */
export const PublishPageHeader: React.FC<PublishPageHeaderProps> = ({
  loading = false,
  children,
  className = "flex-1 flex p-4",
}) => {
  return (
    <Layout loading={loading}>
      <MenuBarPublish />
      <main className={className}>
        {children}
      </main>
    </Layout>
  );
};

// Re-export layoutCurrent for convenience
export { layoutCurrent };