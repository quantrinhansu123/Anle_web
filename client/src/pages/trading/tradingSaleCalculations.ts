import type { CreateTradingSaleDto } from '../../services/tradingSalesService';

export const computeTradingSaleDerived = (draft: CreateTradingSaleDto) => {
  const price = Number(draft.price_usd || 0);
  const quantity = Number(draft.quantity || 0);
  const payment = Number(draft.payment_percent || 0) / 100;
  const rate = Number(draft.exchange_rate || 0);
  const amountUsd = price * quantity;
  const totalVnd = amountUsd * payment * rate;
  return { amountUsd, totalVnd };
};
