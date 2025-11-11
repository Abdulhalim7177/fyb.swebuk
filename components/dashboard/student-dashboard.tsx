import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Users2, Code2, CalendarCheck, GitCommit, Palette, Brain, Server, CloudCog } from "lucide-react";
import Link from "next/link";

interface StudentDashboardProps {
  user: User;
  fullName?: string; // Pass full name from profile
}

export function StudentDashboard({ user, fullName }: StudentDashboardProps) {
  const stats = [
    { title: "My Clubs", value: "3", icon: Users2, iconBg: "bg-primary/10 text-primary" },
    { title: "Active Projects", value: "5", icon: Code2, iconBg: "bg-green-500/10 text-green-500" },
    { title: "Upcoming Events", value: "2", icon: CalendarCheck, iconBg: "bg-purple-500/10 text-purple-500" },
    { title: "Contributions", value: "47", icon: GitCommit, iconBg: "bg-orange-500/10 text-orange-500" },
  ];

  const clubs = [
    { title: "Frontend Club", members: 245, description: "Learn React, Vue, Angular and modern web development.", tag: "Web Development", icon: Palette, iconBg: "bg-primary/10 text-primary", tagBg: "bg-primary/10 text-primary" },
    { title: "AI/ML Club", members: 189, description: "Explore machine learning, deep learning and AI projects.", tag: "Artificial Intelligence", icon: Brain, iconBg: "bg-green-500/10 text-green-500", tagBg: "bg-green-500/10 text-green-500" },
    { title: "Backend Club", members: 167, description: "Master Node.js, Python, databases and server architecture.", tag: "Backend Development", icon: Server, iconBg: "bg-purple-500/10 text-purple-500", tagBg: "bg-purple-500/10 text-purple-500" },
    { title: "DevOps Club", members: 134, description: "Learn Docker, Kubernetes, CI/CD and cloud platforms.", tag: "DevOps", icon: CloudCog, iconBg: "bg-orange-500/10 text-orange-500", tagBg: "bg-orange-500/10 text-orange-500" },
  ];

  const projects = [
    { title: "E-Commerce Platform", description: "Full-stack e-commerce solution with React and Node.js", tags: ["React", "Node.js", "+2 more"] },
    { title: "Image Recognition AI", description: "Deep learning model for image classification and detection.", tags: ["Python", "TensorFlow", "+3 more"] },
    { title: "DevOps Pipeline", description: "Automated CI/CD pipeline with Docker and Kubernetes", tags: ["Docker", "K8s", "+1 more"] },
  ];
  
  const events = [
      { day: "TOM", date: "25", title: "React Workshop", club: "Frontend Club", time: "Tomorrow, 2:00 PM" },
      { day: "FRI", date: "27", title: "ML Model Deployment", club: "AI/ML Club", time: "Friday, 5:00 PM" },
      { day: "MON", date: "30", title: "API Design Patterns", club: "Backend Club", time: "Next Monday, 3:00 PM" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Welcome back, {fullName || user.email}!</h1>
            <p className="text-sm text-primary-foreground/80">Here's what's happening in your development community today.</p>
          </div>
          <Button variant="secondary" asChild className="self-start md:self-auto">
            <Link href="/dashboard/student/profile">View Profile</Link>
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-semibold">{stat.value}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
        {/* Left Column (Clubs & Projects) */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-none">
          {/* Popular Development Clubs */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Popular Development Clubs</h2>
              <a href="#" className="text-sm font-medium text-primary hover:underline">View All</a>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {clubs.map((club, index) => {
                const Icon = club.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${club.iconBg}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{club.title}</h3>
                          <p className="text-sm text-muted-foreground">{club.members} members</p>
                          <p className="mt-2 text-sm text-foreground/80">{club.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${club.tagBg}`}>{club.tag}</span>
                            <Button variant="outline" size="sm" asChild className="border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                              <Link href="#">Join</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Featured Projects */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Featured Projects</h2>
              <a href="#" className="text-sm font-medium text-primary hover:underline">Browse All Projects</a>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {projects.map((project, index) => (
                <Card key={index} className={index === 2 ? "md:col-span-2" : ""}>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {project.tags.map((tag, i) => (
                          <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" asChild className="border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                        <Link href="#">View Project</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Upcoming Events) */}
        <aside className="lg:col-span-1 order-1 lg:order-none">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {events.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-medium">{event.day}</span>
                    <span className="text-lg font-bold">{event.date}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.club}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* CTA Banner */}
      <div className="mt-8 rounded-xl bg-primary p-6 text-primary-foreground md:p-8">
        <h2 className="text-2xl font-semibold">Ready to start building?</h2>
        <p className="mt-1 text-primary-foreground/80">Join a club, start a project, or contribute to existing repositories.</p>
        <div className="mt-4 flex gap-4">
          <Button variant="secondary">Start a Project</Button>
          <Button variant="outline">Browse Clubs</Button>
        </div>
      </div>
    </div>
  );
}