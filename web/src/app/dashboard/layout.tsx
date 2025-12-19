import { DashboardLayout } from "@/components/templates/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>
}
