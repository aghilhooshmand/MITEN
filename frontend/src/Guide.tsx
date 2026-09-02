export function Guide() {
  return (
    <div className="guide">
      <h3>The idea</h3>
      <p>
        Every year MIT Technology Review names <em>10 Breakthrough Technologies</em>. Each name is a
        technology — CRISPR, tiny AI, hyperscale data centers — not a stock ticker. MITEN asks a
        historical question: after that call, did the public companies we linked to that technology
        beat the S&P 500?
      </p>
      <p>
        The unit of analysis is a <em>technology versus the market</em>, not “which stock to buy.”
        Mappings from a technology to tickers are editorial, dated, and shown on the page so they
        can be argued with.
      </p>

      <h3>The name</h3>
      <p>
        MITEN comes from <em>MIT Ten</em> — the annual ten. The two T’s collapsed into one T. The
        mark is meant to read history, focus on the present list, and only then think about the
        future. The 2026 list is a watchlist, not a scorecard.
      </p>

      <h3>How to use this page</h3>
      <ol className="method">
        <li>
          <em>Watchlist</em> is 2026 — names MIT just called, with historical analogs. Not a scorecard
          yet.
        </li>
        <li>
          <em>Dashboard</em> is one MIT edition: pick a year and a named technology, then read the
          gold cohort line against SPY, the follow-through map (every mapped company as a bubble),
          the mapped-company table, and the ranking.
        </li>
        <li>
          <em>Big picture</em> is the whole archive at once: year × subject × each MIT name, colored
          by whether the mapped companies beat SPY. Repeating tickers sit in the strip underneath.
        </li>
        <li>
          Hover any dotted label for a short definition. This Knowledge tab is the long version.
        </li>
      </ol>

      <h3>Keywords</h3>
      <dl>
        <dt>Cohort</dt>
        <dd>
          The group of public companies mapped to one MIT technology, treated as one basket. Each
          name has equal weight (NVIDIA does not get a bigger vote than a smaller peer). The gold
          chart line is this basket, rebased to 100 on the list date. A cohort is not “the MIT
          stock” — MIT does not list a stock.
        </dd>
        <dt>Mapped / mapping</dt>
        <dd>
          A stored link from a named technology to a listed company. Example: “Tiny AI” (2020) is
          mapped to NVIDIA, Apple, and AMD. The link includes a written reason, a confidence label,
          an author, and a date. If there is no mapping, MIT still named the technology; we just
          have no US-listed cohort to score.
        </dd>
        <dt>Mapped only</dt>
        <dd>
          A filter at the top of the page. When it is checked, the ledger hides technologies that
          have no company map. Turn it off to see the full MIT list for that year, including names
          that are “list only.”
        </dd>
        <dt>All mappings</dt>
        <dd>
          Score using every mapped company for that technology: both <em>direct</em> and{" "}
          <em>exposed</em>. This is the broader read. A conglomerate with a relevant division still
          counts.
        </dd>
        <dt>Direct only / direct mapping</dt>
        <dd>
          Score using only companies whose core business <em>is</em> that technology. Exposed names
          are dropped. Use this when you do not want a loose link to pull the average around.
        </dd>
        <dt>Exposed</dt>
        <dd>
          Partial or indirect exposure. The company is in the neighborhood of the technology, not
          the thing itself. Included under All mappings; excluded under Direct only.
        </dd>
        <dt>List only</dt>
        <dd>
          MIT named it. We have no mapped public company with prices in the current universe, so
          there is no score and no cohort line.
        </dd>
        <dt>SPY</dt>
        <dd>
          The SPDR S&P 500 ETF — a stand-in for the US large-cap market. Every prediction score is
          versus SPY on the <em>same dates</em> as the company. If both the cohort and the market
          went up, beating SPY still means the cohort went up more.
        </dd>
        <dt>Equal-weight</dt>
        <dd>
          In the cohort score, a $10 billion company and a $2 trillion company each count as one
          name. That is deliberate: the question is about the mapped set, not about market-cap
          indexes. The follow-through map is the exception — there, bubble area is latest market
          cap so you can see which names are whales.
        </dd>
        <dt>Follow-through map</dt>
        <dd>
          A bubble chart of every mapping (one company × one MIT year). Default X is that company’s
          excess versus SPY after the list date. Default Y is the MIT technology’s prediction score
          (50 = the category matched SPY). Upper-right means the category beat SPY and this name
          did too. Size is market cap. Filters let you hide megacaps and look at smaller listed
          names. It is a diagnostic of the editorial list, not a stock picker.
        </dd>
        <dt>List date</dt>
        <dd>
          The day we treat as MIT’s call for that year. Returns start there, or at IPO if the
          company listed later.
        </dd>
        <dt>Universe</dt>
        <dd>
          All mappings or Direct only — which set of companies is allowed into the score. It is not
          a stock-market “universe” in the professional sense; it is this toggle.
        </dd>
      </dl>

      <h3>Measures</h3>
      <dl>
        <dt>Return</dt>
        <dd>
          Total price change from the list date (or IPO) to the latest price, or to delisting. Not
          annualized. +80% means the holding grew 80% over that whole window.
        </dd>
        <dt>Cohort (column)</dt>
        <dd>
          Average of those company returns, equal-weight. One number for the basket.
        </dd>
        <dt>Excess vs SPY</dt>
        <dd>
          Company return minus SPY return over the same dates, then averaged across the cohort. The
          unit is percentage points (pp), not “percent.” +20pp means twenty points more than SPY,
          not a 20% gain.
        </dd>
        <dt>Hit</dt>
        <dd>
          Share of mapped companies that beat SPY. High excess with a low hit rate usually means
          one winner carried the average.
        </dd>
        <dt>σ (dispersion)</dt>
        <dd>
          How much the companies’ returns disagreed. High σ means the average is a less trustworthy
          summary, so the prediction score is pulled toward 50.
        </dd>
        <dt>Prediction score</dt>
        <dd>
          Centered at 50: in line with SPY. Higher means the mapped names beat SPY after shrinking
          for small samples and disagreement. Lower means they lagged. Always versus SPY, never
          versus Nasdaq, gold, or oil.
        </dd>
        <dt>Verdict</dt>
        <dd>
          A plain-language label from the excess and hit rules: Beat market (excess above +5pp and
          hit rate at least 50%), Lagged (excess below −5pp), Mixed (in between), Thin sample
          (fewer than two names with prices), Too early (the list is too recent).
        </dd>
        <dt>Indexed to 100</dt>
        <dd>
          Every chart line starts at 100 on the list date (or IPO). 150 means +50% from that start.
          This lets you compare growth, not dollar prices.
        </dd>
        <dt>pp</dt>
        <dd>
          Percentage points. The gap between two percentages. 12% minus 7% is 5pp, not 5%.
        </dd>
        <dt>Names (column)</dt>
        <dd>How many mapped companies have a usable price history for this score.</dd>
        <dt>Short window</dt>
        <dd>
          Fewer than three years of overlapping prices. The score exists but is less trustworthy.
        </dd>
        <dt>Analog excess</dt>
        <dd>
          On the 2026 watchlist: average excess of hand-picked older technologies that resemble
          this year’s name. History, not a forecast, and not a buy list.
        </dd>
      </dl>

      <h3>Indexes on the chart</h3>
      <dl>
        <dt>MIT cohort (gold)</dt>
        <dd>The mapped basket. Always shown. This is the series the question is about.</dd>
        <dt>S&P 500 (SPY)</dt>
        <dd>The benchmark the score uses. Toggle it only to hide the line; the score still uses it.</dd>
        <dt>Sector ETF</dt>
        <dd>
          A sector fund matched to our editorial category (for example XLK for AI). Context only.
          It does not change the score.
        </dd>
        <dt>Nasdaq-100 (QQQ)</dt>
        <dd>Growth/tech-heavy index. Context only.</dd>
        <dt>Gold (GLD) and oil (USO)</dt>
        <dd>Macro proxies. Context only. Useful when a MIT theme is energy or a real asset.</dd>
      </dl>

      <h3>Pills and labels</h3>
      <dl>
        <dt>verified / secondary / partial / gap / none</dt>
        <dd>
          How completely that year’s ten titles were checked against MIT’s published list. none
          means MIT did not publish a list that year (2002).
        </dd>
        <dt>Cat. (category)</dt>
        <dd>
          Our editorial bucket — AI, biotech, energy, and so on. It chooses the sector ETF. It is
          not MIT’s taxonomy.
        </dd>
      </dl>

      <h3>What this is not</h3>
      <p>
        Not investment advice. Not a claim that MIT “picks stocks.” Not a live trading system. The
        mappings were written with hindsight (dated seed-v1 / 2026-09-01, with a later seed-v2
        pass for smaller listed names); that bias is visible on purpose.
        purpose. Prices are US-listed Yahoo Finance history. Many MIT names have no public cohort
        here (private firms, China listings, unverified years).
      </p>
    </div>
  );
}
