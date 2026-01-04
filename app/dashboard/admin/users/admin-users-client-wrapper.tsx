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
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Total Users</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 hidden xs:block" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Active</CardTitle>
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 hidden xs:block" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Pending</CardTitle>
            <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 hidden xs:block" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{stats.pendingUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900 shadow-sm hover:shadow-md transition-shadow col-span-3 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-4 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold">Role Distribution</CardTitle>
            <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 hidden xs:block" />
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(stats.roleCounts).map(([role, count]) => (
                <div key={role} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <span className="text-muted-foreground capitalize">{role}:</span>
                  <span className="font-extrabold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full group">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full shadow-sm border-muted-foreground/20 focus-visible:ring-primary/30"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <CreateUserDialog
              onCreate={handleUpdate}
              currentUserRole={currentUserRole}
            />
            <Button variant="outline" className="sm:hidden" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {uniqueDepartments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[160px] text-xs">
                <SelectValue placeholder="All Depts" />
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
              <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs">
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
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs h-9 hover:bg-destructive/10 hover:text-destructive" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
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