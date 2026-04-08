import { useState } from "react";
import type { ContrastCard, Pillar, Stat } from "./data";

type LandingProps = {
  onOpenEditor: () => void;
  onOpenMarketplace: () => void;
  contrastCards: ContrastCard[];
  pillars: Pillar[];
  stats: Stat[];
  yamlPreview: string;
};

export function LandingView({ onOpenEditor, onOpenMarketplace, contrastCards, pillars, stats, yamlPreview }: LandingProps) {
  const [isResolvedExpanded, setIsResolvedExpanded] = useState(false);

  return (
    <main className="page pageLanding">
      <section className="hero">
        <div className="heroCopy">
          <p className="badge">Open standard for AI identity</p>
          <h2>Tu contexto deja de vivir en islas.</h2>
          <p className="lead">
            Agent DNA convierte identidad, reglas, preferencias y contexto de negocio en un contrato portable.
          </p>
          <div className="contrastGrid">
            {contrastCards.map((card) => (
              <article className="contrastCard" key={card.title}>
                <strong>{card.title}</strong>
                <ul>
                  {card.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="ctaRow">
            <button className="primaryCta" onClick={onOpenEditor} type="button">Abrir editor</button>
            <button className="ghostCta" onClick={onOpenMarketplace} type="button">Ver marketplace</button>
          </div>
        </div>

        <div className={isResolvedExpanded ? "heroPanel heroPanelExpanded" : "heroPanel"}>
          <div className="panelHeader">
            <span>Resolved DNA</span>
            <span className="statusDot">Published</span>
          </div>
          <button
            className="previewExpandButton"
            onClick={() => setIsResolvedExpanded((current) => !current)}
            type="button"
          >
            {isResolvedExpanded ? "Ver menos" : "Ver mas"}
          </button>
          <pre>{yamlPreview}</pre>
        </div>
      </section>

      <section className="statsGrid">
        {stats.map((stat) => (
          <article className="statCard" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="pillars">
        {pillars.map((pillar) => (
          <article className="pillarCard" key={pillar.title}>
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
