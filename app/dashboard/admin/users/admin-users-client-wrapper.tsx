"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserTable } from "./user-table";
import { CreateUserDialog } from "./create-user-dialog";
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

interface AdminUsersClientWrapperProps {
  initialProfiles: UserProfile[];
  currentUserRole: string;
}

export default function AdminUsersClientWrapper({
  initialProfiles,
  currentUserRole,
}: AdminUsersClientWrapperProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleUpdate = () => {
    // Re-fetches server component data
    router.refresh();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const filteredProfiles = useMemo(() => {
    return initialProfiles // Filter the original list, not the state one
      .filter((profile) => {
        if (roleFilter === "all") return true;
        return profile.role === roleFilter;
      })
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
  }, [initialProfiles, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalUsers = initialProfiles.length;
    const activeUsers = initialProfiles.filter((p) => !!p.email_confirmed_at).length;
    const pendingUsers = totalUsers - activeUsers;
    const roleCounts = initialProfiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { totalUsers, activeUsers, pendingUsers, roleCounts };
  }, [initialProfiles]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(initialProfiles.map(p => p.role));
    return Array.from(roles);
  }, [initialProfiles]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            Manage system students, roles, and permissions.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {Object.entries(stats.roleCounts).map(([role, count]) => (
              <div key={role} className="flex justify-between">
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}:</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
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
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
        <CreateUserDialog
          onCreate={handleUpdate}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* User Table */}
      <UserTable
        profiles={filteredProfiles}
        currentUserRole={currentUserRole}
        onUpdate={handleUpdate}
      />
    </div>
  );
}