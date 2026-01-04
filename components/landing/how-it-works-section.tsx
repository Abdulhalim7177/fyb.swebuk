export function HowItWorksSection() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="animate-on-scroll">How <span className="text-gradient">Swebuk</span> Works</h2>
          <p className="animate-on-scroll delay-1">Get started in minutes and unlock your full potential as a software engineer.</p>
        </div>
        
        <div className="steps-container">
          <div className="glass-card step-card animate-on-scroll delay-1">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Create your account and select your academic level. Students from Level 100 to 400 are welcome.</p>
          </div>

          <div className="glass-card step-card animate-on-scroll delay-2">
            <div className="step-number">2</div>
            <h4>Join Clusters</h4>
            <p>Browse and join tech clusters that match your interests. Each cluster has its own community and projects.</p>
          </div>

          <div className="glass-card step-card animate-on-scroll delay-3">
            <div className="step-number">3</div>
            <h4>Collaborate</h4>
            <p>Participate in projects, attend events, and engage in discussions. Learn from peers and mentors.</p>
          </div>

          <div className="glass-card step-card animate-on-scroll delay-4">
            <div className="step-number">4</div>
            <h4>Build Portfolio</h4>
            <p>Showcase your projects, skills, and achievements. Create a professional profile that stands out.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
