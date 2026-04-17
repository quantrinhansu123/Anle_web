/**
 * SLA Calculation Utilities
 * Handles delay detection, alert level classification, and SLA breach logic.
 */

export type SlaAlertLevel = 'none' | 'internal' | 'customer' | 'breach';

// Configurable SLA thresholds (hours)
const SLA_THRESHOLDS = {
  INTERNAL_ALERT: 2,   // > 2h → notify internal ops
  CUSTOMER_ALERT: 6,   // > 6h → notify customer
  SLA_BREACH: 24,      // > 24h → mark as SLA breach
};

/**
 * Calculate delay hours between now and the expected ETA.
 * Returns 0 if ETA is in the future or not provided.
 */
export function calculateDelayHours(plannedEta?: string | null, actualEta?: string | null): number {
  if (!plannedEta) return 0;
  
  // Normalize both dates to UTC timestamps
  const plannedTimeMs = new Date(plannedEta).getTime();
  if (isNaN(plannedTimeMs)) return 0;

  // Use actualEta if available, otherwise current time
  const actualTimeMs = actualEta ? new Date(actualEta).getTime() : new Date().getTime();
  if (isNaN(actualTimeMs)) return 0;

  const diffMs = actualTimeMs - plannedTimeMs;
  if (diffMs <= 0) return 0;

  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // round to 1 decimal
}

/**
 * Determine alert level based on delay hours.
 */
export function getSlaAlertLevel(delayHours: number): SlaAlertLevel {
  if (delayHours >= SLA_THRESHOLDS.SLA_BREACH) return 'breach';
  if (delayHours >= SLA_THRESHOLDS.CUSTOMER_ALERT) return 'customer';
  if (delayHours >= SLA_THRESHOLDS.INTERNAL_ALERT) return 'internal';
  return 'none';
}

/**
 * Get severity for auto-created incidents based on delay hours.
 */
export function getDelaySeverity(delayHours: number): 'low' | 'medium' | 'high' | 'critical' {
  if (delayHours >= 24) return 'critical';
  if (delayHours >= 12) return 'high';
  if (delayHours >= 6) return 'medium';
  return 'low';
}

/**
 * Get human-readable alert message.
 */
export function getSlaAlertMessage(delayHours: number, shipmentCode?: string): string {
  const ref = shipmentCode ? ` [${shipmentCode}]` : '';
  const level = getSlaAlertLevel(delayHours);

  switch (level) {
    case 'breach':
      return `🚨 SLA BREACH${ref}: Delay ${delayHours}h exceeds SLA limit`;
    case 'customer':
      return `⚠️ Customer Alert${ref}: Shipment delayed ${delayHours}h — customer notification required`;
    case 'internal':
      return `⏰ Internal Alert${ref}: Shipment delayed ${delayHours}h — ops review needed`;
    default:
      return '';
  }
}
