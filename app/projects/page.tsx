import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { PageAnimations } from "@/components/landing/page-animations";
import { Code2, Cpu, Globe2, ShieldCheck, Database, Layout, Smartphone, ShoppingCart, GraduationCap, Stethoscope, Users, Leaf } from "lucide-react";

const projectAreas = [
  {
    title: "Software Engineering Core",
    description: "Methodologies, Requirements Engineering, Testing/QA, Maintenance, and Design Patterns.",
    icon: Code2,
    color: "blue"
  },
  {
    title: "Data Science & AI",
    description: "Machine Learning, Deep Learning, NLP, Sentiment Analysis, and Hate Speech Detection.",
    icon: Cpu,
    color: "emerald"
  },
  {
    title: "Security",
    description: "Software security vulnerabilities and Blockchain Security.",
    icon: ShieldCheck,
    color: "red"
  },
  {
    title: "Applied Systems",
    description: "E-learning systems, Recommender systems, and Human-Computer Interaction (HCI).",
    icon: Layout,
    color: "purple"
  }
];

const studentProjectCategories = [
  { title: "Security", icon: ShieldCheck, examples: "Facial recognition systems" },
  { title: "Commerce", icon: ShoppingCart, examples: "E-commerce, Price comparison, Inventory management" },
  { title: "Education", icon: GraduationCap, examples: "E-learning platforms, Exam systems" },
  { title: "Health", icon: Stethoscope, examples: "Medication & Hospital management" },
  { title: "Public Service", icon: Users, examples: "Traffic management, Public complaint systems" },
  { title: "Agriculture", icon: Leaf, examples: "Agricultural products price comparison" }
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navigation />
      
      <main className="flex-grow pt-20">
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Our Innovation & Projects</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              The Software Engineering Department is at the forefront of the computing revolution, redefining the future of innovation through practical research and development.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">Key Research Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {projectAreas.map((area, index) => (
                <div key={index} className="glass-card p-8 flex flex-col items-center text-center group hover:scale-105 transition-transform">
                  <div className={`w-16 h-16 rounded-2xl bg-${area.color}-100 dark:bg-${area.color}-900/30 flex items-center justify-center mb-6`}>
                    <area.icon className={`w-8 h-8 text-${area.color}-600 dark:text-${area.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{area.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-50 dark:bg-blue-900/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">Student Project Repository</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentProjectCategories.map((cat, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat.title}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{cat.examples}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Student Innovation Hub</h2>
                <p className="text-xl opacity-90 mb-8 leading-relaxed">
                  Our department encourages students to work on real-world projects through clusters and individual initiatives. From Level 100 to final year projects, innovation is at our core.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full font-medium">
                    100+ Active Projects
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full font-medium">
                    20+ Specialized Clusters
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 flex items-center justify-center">
                  <Code2 className="w-32 h-32 opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <PageAnimations />
    </div>
  );
}
