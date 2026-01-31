import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { PageAnimations } from "@/components/landing/page-animations";
import Image from "next/image";

const staff = [
  {
    name: "Assoc Prof. Kabir Umar",
    interest: "Software security vulnerabilities testing for web, cloud and mobile applications using search techniques and artificial intelligence techniques",
    quals: "BSc. Computer Science; MSc Computer Science; PhD Software Engineering",
    rank: "Associate Professor",
    email: "ukabir.se@buk.edu.ng",
    image: "/staff/kabir-umar.jpg"
  },
  {
    name: "Prof. Bashir S. Galadanci",
    interest: "Software Engineering and Data Science",
    quals: "B.Sc. Electrical Engineering MSc. Computer Engineering PhD. Computer Engineering.",
    rank: "Professor",
    email: "bhgaladanchi.se@buk.edu.ng",
    image: "/staff/bashir-galadanci.png"
  },
  {
    name: "Dr. Mohammad Hassan",
    interest: "Software Engineering and Data Science",
    quals: "B.SC. Mathematics M.SC. Mathematics PhD. Computer Science and Engineering",
    rank: "Senior Lecturer",
    email: "mhassan.se@buk.edu.ng",
    image: "/staff/mohammad-hassan.jpg"
  },
  {
    name: "Dr. Rasheed A. Rasheed",
    interest: "E-learning systems, Recommender systems",
    quals: "BSc. Computer Science; MSc Management Information Systems; MSc Software Engineering; PhD Computer Science",
    rank: "Lecturer 1",
    email: "rarasheed.se@buk.edu.ng",
    image: "/staff/rasheed-rasheed.jpg"
  },
  {
    name: "Dr. Shamsudden Hassan Muhammad",
    interest: "Natural Language Processing, Language Modelling, Sentiment Analysis, Emotion Analysis, Hate Speech Detection, Data Science for Social Good",
    quals: "BSc. Computer Science (BUK), MSc. Computer Science, PhD Computer Science.",
    rank: "Lecturer I",
    email: "shmuhammad.se@buk.edu.ng",
    image: "/staff/shamsudden-muhammad.jpg"
  },
  {
    name: "Dr. Saratu Yusuf Ilu",
    interest: "Applied Software Engineering, Deep Learning, Data Science, Human-Computer Interaction",
    quals: "Ph. D. Computer Science, M.SC. SOFTWARE ENGINEERING, B.SC. COMPUTER SCIENCE",
    rank: "Lecturer I",
    email: "syilu.cs@buk.edu.ng",
    image: "/staff/user.png"
  },
  {
    name: "Maryam Ibrahim Mukhtar",
    interest: "Software Engineering and Data Science",
    quals: "M.SC. COMPUTER SCIENCE, B.SC. COMPUTER SCIENCE",
    rank: "Lecturer I",
    email: "mimukhtar.se@buk.edu.ng",
    image: "/staff/maryam-mukhtar.jpg"
  },
  {
    name: "Sanah Mu'az Abdullahi",
    interest: "Software Engineering and Data Science",
    quals: "M.SC. COMPUTER SCIENCE, B.SC. COMPUTER SCIENCE",
    rank: "Lecturer I",
    email: "mimukhtar.se@buk.edu.ng",
    image: "/staff/user.png"
  },
  {
    name: "Almustapha Abdullahi Wakili",
    interest: "Applied Software Engineering, Deep Learning, Blockchain Security",
    quals: "M.SC. SOFTWARE ENGINEERING, B.SC. COMPUTER SCIENCE",
    rank: "Assistant Lecturer",
    email: "aawakili.se@buk.edu.ng",
    image: "/staff/almustapha-wakili.jpg"
  },
  {
    name: "Buhari Ubale",
    interest: "Software Engineering, Artificial Intelligence, Data Science.",
    quals: "M.SC. SOFTWARE ENGINEERING, B.SC. COMPUTER SCIENCE",
    rank: "Assistant Lecturer",
    email: "bubale.se@buk.edu.ng",
    image: "/staff/buhari-ubale.jpg"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navigation />
      
      <main className="flex-grow pt-20">
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">About Us</h1>
                <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-6">
                  The Software Engineering Department at Bayero University Kano is a leading institution in software engineering education and research.
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  We offer world-class university education led by esteemed professors and researchers, promoting discovery and innovation in software engineering.
                </p>
              </div>
              <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden shadow-2xl group">
                <Image 
                  src="/section-image.jpg" 
                  alt="Students collaborating" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <div className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg inline-block mb-2">BUK SWE</div>
                  <p className="text-white/90 font-medium">Empowering the next generation of innovators</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our History</h2>
            <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                The Software Engineering Department at Bayero University Kano (BUK) was established in response to the growing demand for skilled software engineers in Nigeria and beyond. The journey began in the early 2000s when the university recognized the need to expand its technological and engineering disciplines to keep pace with global advancements.
              </p>
              <p>
                In 2003, a task force was formed, comprising esteemed faculty members from the university's existing computer science and engineering departments. By 2005, the proposal for the new department was finalized, and the Software Engineering Department was officially launched. The inaugural batch of students commenced their studies in September 2006.
              </p>
              <p>
                Today, the department is renowned for its excellence in education and research. It has produced numerous graduates who have gone on to make significant contributions to the tech industry, both locally and internationally.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">Faculty & Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.map((member, index) => (
                <div key={index} className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-[480px]">
                  {/* Card Header with Gradient */}
                  <div className="h-40 bg-gradient-to-r from-blue-600 to-cyan-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                  </div>

                  {/* Avatar */}
                  <div className="relative -mt-24 flex justify-center z-10">
                    <div className="w-48 h-48 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white relative">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium uppercase tracking-wider">{member.rank}</p>
                    
                    <div className="mt-6 flex justify-center">
                      <span className="text-xs text-slate-400 font-medium px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">Hover for details</span>
                    </div>
                  </div>

                  {/* Slide-up Details Overlay */}
                  <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-8 flex flex-col justify-center transition-transform duration-500 ease-in-out translate-y-full group-hover:translate-y-0 z-20 text-left">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Qualifications</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{member.quals}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Research Interest</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">{member.interest}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Contact</p>
                        <a href={`mailto:${member.email}`} className="text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words">
                          {member.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-50 dark:bg-blue-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Our Vision</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  To be a leading hub of excellence in software engineering education, research, and innovation, empowering students to become skilled professionals and thought leaders in the global software industry.
                </p>
              </div>
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Our Mission</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Designing and delivering innovative curricula for future software engineers.</li>
                  <li>Conducting cutting-edge research projects.</li>
                  <li>Developing advanced mathematical models and efficient algorithms.</li>
                  <li>Facilitating knowledge transfer between academia and industry.</li>
                  <li>Addressing societal challenges through software engineering.</li>
                </ul>
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