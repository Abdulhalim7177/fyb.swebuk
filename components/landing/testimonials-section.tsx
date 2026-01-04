export function TestimonialsSection() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="animate-on-scroll">What Students <span className="text-gradient">Say</span></h2>
          <p className="animate-on-scroll delay-1">Hear from students who have transformed their learning experience with Swebuk.</p>
        </div>
        
        <div className="testimonials-grid">
          <div className="glass-card testimonial-card animate-on-scroll delay-1">
            <p className="testimonial-content">
              Swebuk completely changed how I approach software engineering. The collaboration tools and project opportunities helped me land my first internship!
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">AK</div>
              <div className="author-info">
                <h5>Amina Kamara</h5>
                <span>Level 300 • Web Development Cluster</span>
              </div>
            </div>
          </div>

          <div className="glass-card testimonial-card animate-on-scroll delay-2">
            <p className="testimonial-content">
              The FYP module made managing my final year project so much easier. My supervisor could track my progress and provide feedback in real-time.
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">JM</div>
              <div className="author-info">
                <h5>Joshua Mensah</h5>
                <span>Level 400 • AI & Machine Learning Cluster</span>
              </div>
            </div>
          </div>

          <div className="glass-card testimonial-card animate-on-scroll delay-3">
            <p className="testimonial-content">
              Being part of the Mobile Dev cluster exposed me to React Native and Flutter. I've now built 3 apps with my cluster mates. Amazing community!
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">FO</div>
              <div className="author-info">
                <h5>Fatima Osei</h5>
                <span>Level 200 • Mobile Development Cluster</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
