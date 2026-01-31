import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { PageAnimations } from "@/components/landing/page-animations";
import { Clock, Globe, MapPin, CheckCircle2 } from "lucide-react";

export default function AcademicsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navigation />
      
      <main className="flex-grow pt-20">
        <section className="relative py-20 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Software Engineering</h1>
            <p className="text-xl opacity-90 mb-12">Bachelor of Science Degree</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl">
                <Clock className="w-8 h-8" />
                <div>
                  <div className="text-sm opacity-70">Duration</div>
                  <div className="font-bold text-lg">4 Years</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl">
                <Globe className="w-8 h-8" />
                <div>
                  <div className="text-sm opacity-70">Language</div>
                  <div className="font-bold text-lg">English</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl">
                <MapPin className="w-8 h-8" />
                <div>
                  <div className="text-sm opacity-70">Location</div>
                  <div className="font-bold text-lg">Bayero University, Kano</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Programme Overview</h2>
              </div>
              <div className="lg:col-span-2 space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                <p>
                  The Software Engineering program at Bayero University Kano is a 4-year comprehensive degree program that integrates theoretical knowledge with practical skills, preparing students to become future leaders in the field.
                </p>
                <p>
                  The program comprises semesters of integrated preparatory training, followed by 6 months of industrial training, and specialization phases. Students delve into AI, data science, communication networks, and software engineering methodologies.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Postgraduate Programmes</h2>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Professional Masters in Software Engineering (MSE)</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                The Department offers a Professional Masters degree designed for industry professionals looking to advance their technical and managerial skills. This program bridges the gap between theoretical computer science and practical software development challenges in the enterprise.
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                 <span className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4" /> 18-24 Months
                </span>
                 <span className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                  <Globe className="w-4 h-4" /> Hybrid Learning
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">Admission Criteria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-6">First-Year Entry (UTME)</h3>
                <ul className="space-y-4 text-slate-600 dark:text-slate-300">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Minimum aggregate score of 180 in UTME.</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Five (5) credits in SSCE (WAEC/NECO) including English, Mathematics, and Physics.</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Must pass the University's Post-UTME test.</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-6">Direct Entry</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Direct entry requirements include appropriate A-level results or Diplomas in relevant fields of study. Contact the department for more specific details.
                </p>
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
