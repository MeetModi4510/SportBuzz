interface Creator {
  name: string;
  role: string;
  icon: JSX.Element;
  image?: string;
  description: string;
  links: SocialLinks;
  gradient: string;
}

const creators: Creator[] = [
  {
    name: "Meet Modi",
    role: "Lead Full Stack Developer",
    icon: <Code2 className="w-6 h-6 text-blue-400" />,
    image: "/creators/meet_modi.jpg",
    description: "Architecting the core engine and real-time synchronization of SportBuzz.",
    links: {
      linkedin: "https://www.linkedin.com/in/meet-modi-a227a1295?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      github: "https://github.com/MeetModi4510"
    },
    gradient: "from-blue-600/20 to-indigo-600/20"
  },
  {
    name: "Pranshu Patel",
    role: "Backend Architect",
    icon: <Database className="w-6 h-6 text-emerald-400" />,
    description: "Specializing in high-performance data processing and API optimization.",
    links: {
      linkedin: "#",
      github: "#"
    },
    gradient: "from-emerald-600/20 to-teal-600/20"
  },
  {
    name: "Krushit Alonja",
    role: "UI/UX Specialist",
    icon: <Layout className="w-6 h-6 text-purple-400" />,
    description: "Crafting the immersive visual identities and premium user experiences.",
    links: {
      linkedin: "#",
      github: "#"
    },
    gradient: "from-purple-600/20 to-pink-600/20"
  }
];

export const CreatorsSection = () => {
  return (
    <section className="py-20 relative overflow-hidden border-t border-border/50">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-display">
            Meet the <span className="gradient-text">Creators</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            The dedicated team behind the innovative sports analytics and scoring platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {creators.map((creator, i) => (
            <div 
              key={i}
              className={`group relative p-8 rounded-2xl border border-border/50 bg-gradient-to-br ${creator.gradient} backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              
              <div className="relative space-y-6">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-background/50 border border-border/50 shadow-inner group-hover:border-blue-500/50 transition-colors">
                  {creator.image ? (
                    <img 
                      src={creator.image} 
                      alt={creator.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {creator.icon}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">{creator.name}</h3>
                  <p className="text-sm font-medium text-blue-400 uppercase tracking-widest">{creator.role}</p>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {creator.description}
                </p>
                
                <div className="pt-4 flex items-center gap-3">
                  {creator.links.linkedin && creator.links.linkedin !== "#" && (
                    <a 
                      href={creator.links.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-white/10 text-muted-foreground hover:text-indigo-400 transition-all border border-border/50 hover:border-white/20"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {creator.links.github && creator.links.github !== "#" && (
                    <a 
                      href={creator.links.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-white/10 text-muted-foreground hover:text-white transition-all border border-border/50 hover:border-white/20"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors group/link cursor-default">
                    Details <ExternalLink className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
