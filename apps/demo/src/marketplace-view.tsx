import type { MarketplaceCard } from "./data";

type MarketplaceProps = {
  cards: MarketplaceCard[];
  onClone: (name: string) => void;
};

export function MarketplaceView({ cards, onClone }: MarketplaceProps) {
  return (
    <main className="page pageMarketplace">
      <section className="marketHeader">
        <p className="badge">Marketplace</p>
        <h2>DNAs listos para clonar, adaptar y publicar.</h2>
      </section>

      <section className="marketGrid">
        {cards.map((card) => (
          <article className="marketCard" key={card.name}>
            <div className="marketTop">
              <span>{card.tag}</span>
              <button onClick={() => onClone(card.name)} type="button">Clonar</button>
            </div>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
