import { Github, Linkedin, ExternalLink, Code2, Layout, Database } from "lucide-react";

interface SocialLinks {
  linkedin?: string;
  github?: string;
}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {creators.map((creator, i) => (
            <div 
              key={i}
              className="group relative p-6 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm overflow-hidden"
            >
              {/* Subtle accent line based on their original gradient colors but just as a tiny border */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${creator.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary border border-border/50 shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                    {creator.image ? (
                      <img 
                        src={creator.image} 
                        alt={creator.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {creator.icon}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{creator.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{creator.role}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {creator.description}
                </p>
                
                <div className="pt-2 flex items-center gap-2">
                  {creator.links.linkedin && creator.links.linkedin !== "#" && (
                    <a 
                      href={creator.links.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {creator.links.github && creator.links.github !== "#" && (
                    <a 
                      href={creator.links.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
