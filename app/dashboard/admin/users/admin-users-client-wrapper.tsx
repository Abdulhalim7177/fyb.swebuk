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
import { Users, UserCheck, UserX, ShieldCheck, UserSquare, GraduationCap, BookOpen, Users2 } from "lucide-react";
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
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const handleUpdate = () => {
    // Re-fetches server component data
    router.refresh();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setLevelFilter("all");
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
        if (departmentFilter === "all") return true;
        return profile.department === departmentFilter;
      })
      .filter((profile) => {
        if (levelFilter === "all") return true;
        return (profile.academic_level || "student") === levelFilter;
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
  }, [initialProfiles, searchTerm, roleFilter, statusFilter, departmentFilter, levelFilter]);

  const stats = useMemo(() => {
    const totalUsers = initialProfiles.length;
    const activeUsers = initialProfiles.filter((p) => !!p.email_confirmed_at).length;
    const pendingUsers = totalUsers - activeUsers;
    const roleCounts = initialProfiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const academicLevelCounts = initialProfiles.reduce((acc, profile) => {
      const level = profile.academic_level || "student";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const departmentCounts = initialProfiles.reduce((acc, profile) => {
      if (profile.department) {
        acc[profile.department] = (acc[profile.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return { totalUsers, activeUsers, pendingUsers, roleCounts, academicLevelCounts, departmentCounts };
  }, [initialProfiles]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(initialProfiles.map(p => p.role));
    return Array.from(roles);
  }, [initialProfiles]);

  const uniqueAcademicLevels = useMemo(() => {
    const levels = new Set(initialProfiles.map(p => p.academic_level || "student"));
    return Array.from(levels);
  }, [initialProfiles]);

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(
      initialProfiles.map(p => p.department).filter(Boolean) as string[]
    );
    return Array.from(departments).sort();
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
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
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
          {uniqueDepartments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {uniqueAcademicLevels.length > 0 && (
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueAcademicLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level === "student" ? "Student" : level.replace("level_", "Level ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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