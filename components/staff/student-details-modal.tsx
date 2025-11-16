"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Users,
  Award,
  Github,
  Linkedin,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Student {
  id: string;
  email: string;
  role: string;
  first_name: string;
  surname: string;
  middle_name?: string;
  department: string;
  institution: string;
  academic_level: number;
  registration_number: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  cluster_id?: string;
  linkedin_handle?: string;
  github_handle?: string;
  photo_url?: string;
  skills?: string[];
  clusters?: { name: string };
  cluster_members?: {
    status: string;
    role: string;
    joined_at: string;
  };
  fyp_status?: string;
  gpa?: number;
  attendance_rate?: number;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
  }>;
  blog_posts?: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
  attendance_records?: Array<{
    date: string;
    event: string;
    status: string;
  }>;
}

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

export function StudentDetailsModal({
  isOpen,
  onClose,
  student,
}: StudentDetailsModalProps) {
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentDetails(student.id);
    }
  }, [isOpen, student]);

  const fetchStudentDetails = async (studentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`);
      const data = await response.json();

      if (response.ok) {
        setStudentDetails(data.student);
      } else {
        console.error("Error fetching student details:", data.error);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAcademicLevelBadge = (level: number) => {
    const colors = {
      100: "bg-blue-100 text-blue-800",
      200: "bg-green-100 text-green-800",
      300: "bg-yellow-100 text-yellow-800",
      400: "bg-purple-100 text-purple-800",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (student: Student) => {
    if (student.is_suspended) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (!student.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getFYPStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
      "not_started": { label: "Not Started", variant: "secondary" as const },
      "proposal": { label: "Proposal", variant: "default" as const },
      "in_progress": { label: "In Progress", variant: "default" as const },
      "review": { label: "Under Review", variant: "secondary" as const },
      "completed": { label: "Completed", variant: "default" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Comprehensive view of student profile and academic progress
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading student details...</div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={student.photo_url} />
                      <AvatarFallback className="text-2xl">
                        {student.first_name[0]}{student.surname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {student.first_name} {student.middle_name} {student.surname}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(student)}
                          <Badge className={getAcademicLevelBadge(student.academic_level)}>
                            {student.academic_level} Level
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            Reg. No: {student.registration_number}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {student.clusters?.name || "No Cluster"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Department:</span> {student.department}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Institution:</span> {student.institution}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Joined:</span>{" "}
                            {new Date(student.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills and Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {student.skills?.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      )) || <span className="text-muted-foreground">No skills listed</span>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {student.github_handle && (
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        <a
                          href={`https://github.com/${student.github_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {student.github_handle}
                        </a>
                      </div>
                    )}
                    {student.linkedin_handle && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        <a
                          href={`https://linkedin.com/in/${student.linkedin_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {student.linkedin_handle}
                        </a>
                      </div>
                    )}
                    {!student.github_handle && !student.linkedin_handle && (
                      <span className="text-muted-foreground">No social links provided</span>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">GPA</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentDetails?.gpa || "N/A"}</div>
                    <p className="text-xs text-muted-foreground">Grade Point Average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentDetails?.attendance_rate || 0}%</div>
                    <Progress value={studentDetails?.attendance_rate || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">FYP Status</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getFYPStatusBadge(studentDetails?.fyp_status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Academic Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Progress</CardTitle>
                  <CardDescription>
                    Track student's academic journey and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">100 Level</span>
                        <span className="text-sm text-muted-foreground">Completed</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">200 Level</span>
                        <span className="text-sm text-muted-foreground">Completed</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">300 Level</span>
                        <span className="text-sm text-muted-foreground">
                          {student.academic_level >= 300 ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <Progress value={student.academic_level >= 300 ? 100 : 50} />
                    </div>
                    {student.academic_level >= 400 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">400 Level</span>
                          <span className="text-sm text-muted-foreground">In Progress</span>
                        </div>
                        <Progress value={50} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    Student's project contributions and participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentDetails?.projects?.length ? (
                    <div className="space-y-4">
                      {studentDetails.projects.map((project) => (
                        <div key={project.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          {getProjectStatusIcon(project.status)}
                          <div className="flex-1">
                            <h4 className="font-medium">{project.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{project.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No projects found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blog" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>
                    Student's blog contributions and articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentDetails?.blog_posts?.length ? (
                    <div className="space-y-4">
                      {studentDetails.blog_posts.map((post) => (
                        <div key={post.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{post.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{post.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No blog posts found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>
                    Student's attendance at events and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentDetails?.attendance_records?.length ? (
                    <div className="space-y-4">
                      {studentDetails.attendance_records.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{record.event}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={record.status === "present" ? "default" : "secondary"}
                          >
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}