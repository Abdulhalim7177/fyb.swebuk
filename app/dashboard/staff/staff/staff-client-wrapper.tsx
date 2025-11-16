"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StaffTable } from "./staff-table";
import { CreateStaffDialog } from "./create-staff-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserCheck, UserX, ShieldCheck, UserSquare } from "lucide-react";
import { UserProfile } from "./page"; // Import the shared interface from page.tsx

interface StaffClientWrapperProps {
  initialProfiles: UserProfile[];
  currentUserRole: string;
}

export default function StaffClientWrapper({
  initialProfiles,
  currentUserRole,
}: StaffClientWrapperProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleUpdate = () => {
    // Re-fetches server component data
    router.refresh();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const filteredProfiles = useMemo(() => {
    return initialProfiles // Filter the original list, not the state one
      .filter((profile) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return !!profile.email_confirmed_at;
        if (statusFilter === "pending") return !profile.email_confirmed_at;
        return true;
      })
      .filter((profile) => {
        if (!searchTerm) return true;
        const name = profile.full_name || "";
        const email = profile.email || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
  }, [initialProfiles, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalStaff = initialProfiles.length;
    const activeStaff = initialProfiles.filter((p) => !!p.email_confirmed_at).length;
    const pendingStaff = totalStaff - activeStaff;
    return { totalStaff, activeStaff, pendingStaff };
  }, [initialProfiles]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage system staff members and permissions.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Staff</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingStaff}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="flex-1 w-full">
          <Input
            placeholder="Filter by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
          <CreateStaffDialog
            onCreate={handleUpdate}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>

      {/* Staff Table */}
      <StaffTable
        profiles={filteredProfiles}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdate}
      />
    </div>
  );
}