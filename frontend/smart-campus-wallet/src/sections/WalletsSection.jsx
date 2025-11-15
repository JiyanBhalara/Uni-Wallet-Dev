import React from "react";
import PageShell from "../components/ui/PageShell";
import WalletCardsRow from "../components/wallet/WalletCardsRow";

const WalletsSection = ({ wallets }) => (
  <PageShell>
    <h2 className="text-base font-semibold text-slate-900 mb-4">
      Your wallets & cards
    </h2>
    <WalletCardsRow wallets={wallets} />
    <p className="text-xs text-slate-500">
      In the final version, this section will sync balances from your campus
      system and bank via APIs.
    </p>
  </PageShell>
);

export default WalletsSection;
