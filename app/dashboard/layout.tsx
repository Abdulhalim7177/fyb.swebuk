import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardWrapper>
      {children}
    </DashboardWrapper>
  );
}