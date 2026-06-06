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
    <section className="py-8 md:py-12 border-t border-border/20 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
          {/* Minimal Title */}
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              <span className="text-primary">SportBuzz</span> Built By
            </h2>
            <p className="text-sm text-muted-foreground">
              The engineers behind the real-time experience.
            </p>
          </div>

          {/* Compact Creator Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-5">
            {creators.map((creator, i) => (
              <div 
                key={i}
                className="group flex items-center gap-3 md:gap-4 p-2 pr-5 md:pr-6 rounded-full border border-border/30 bg-card hover:bg-secondary/40 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  {creator.image ? (
                    <img src={creator.image} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="scale-90">{creator.icon}</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{creator.name}</span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                      {creator.links.github && creator.links.github !== "#" && (
                        <a href={creator.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>
                      )}
                      {creator.links.linkedin && creator.links.linkedin !== "#" && (
                        <a href={creator.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{creator.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
