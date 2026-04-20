import type { HeaderTabState } from './bl-tabs/HeaderTab';
import { emptyHeaderState } from './bl-tabs/HeaderTab';
import type { ContainerTabState } from './bl-tabs/ContainerTab';
import { emptyContainerState } from './bl-tabs/ContainerTab';
import type { MarksDescriptionTabState } from './bl-tabs/MarksDescriptionTab';
import { emptyMarksDescriptionState } from './bl-tabs/MarksDescriptionTab';
import type { FreightTabState } from './bl-tabs/FreightTab';
import { emptyFreightState } from './bl-tabs/FreightTab';

export const SEA_HOUSE_BL_SCHEMA_VERSION = 1 as const;

export type SeaHouseBlTopBar = {
  hbl: string;
  blType: string;
  blReleaseStatus: string;
  bound: string;
  masterBl: string;
  shipment: string;
  switchBl: string;
  loadType: string;
  jobNo: string;
  incoterm: string;
  serviceTerm: string;
};

export type SeaHouseBlBlobV1 = {
  v: typeof SEA_HOUSE_BL_SCHEMA_VERSION;
  topBar: SeaHouseBlTopBar;
  header: HeaderTabState;
  container: ContainerTabState;
  marks: MarksDescriptionTabState;
  freight: FreightTabState;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

export function emptyTopBar(): SeaHouseBlTopBar {
  return {
    hbl: '',
    blType: '',
    blReleaseStatus: '',
    bound: '',
    masterBl: '',
    shipment: '',
    switchBl: '',
    loadType: '',
    jobNo: '',
    incoterm: '',
    serviceTerm: '',
  };
}

export function buildSeaHouseBlBlobV1(params: {
  topBar: SeaHouseBlTopBar;
  header: HeaderTabState;
  container: ContainerTabState;
  marks: MarksDescriptionTabState;
  freight: FreightTabState;
}): Record<string, unknown> {
  const blob: SeaHouseBlBlobV1 = {
    v: SEA_HOUSE_BL_SCHEMA_VERSION,
    topBar: { ...params.topBar },
    header: { ...params.header },
    container: { ...params.container, volumeInfoRows: [...params.container.volumeInfoRows], containerRows: [...params.container.containerRows] },
    marks: {
      ...params.marks,
      sellingLines: [...params.marks.sellingLines],
    },
    freight: {
      ...params.freight,
      sellingRows: [...params.freight.sellingRows],
      buyingRows: [...params.freight.buyingRows],
      payOnBehalfRows: [...params.freight.payOnBehalfRows],
    },
  };
  return { ...blob } as unknown as Record<string, unknown>;
}

/** Returns hydrated pieces if blob matches v1 schema; otherwise null. */
export function parseSeaHouseBlV1(blob: unknown): {
  topBar: SeaHouseBlTopBar;
  header: HeaderTabState;
  container: ContainerTabState;
  marks: MarksDescriptionTabState;
  freight: FreightTabState;
} | null {
  if (!isRecord(blob)) return null;
  if (blob.v !== SEA_HOUSE_BL_SCHEMA_VERSION) return null;
  if (!isRecord(blob.topBar) || !isRecord(blob.header) || !isRecord(blob.container) || !isRecord(blob.marks) || !isRecord(blob.freight)) {
    return null;
  }
  try {
    const topBar: SeaHouseBlTopBar = { ...emptyTopBar(), ...(blob.topBar as unknown as SeaHouseBlTopBar) };
    const header: HeaderTabState = { ...emptyHeaderState(), ...(blob.header as unknown as HeaderTabState) };
    const containerDefaults = emptyContainerState();
    const container: ContainerTabState = {
      ...containerDefaults,
      ...(blob.container as unknown as ContainerTabState),
      volumeInfoRows: Array.isArray((blob.container as { volumeInfoRows?: unknown }).volumeInfoRows)
        ? ([...(blob.container as unknown as ContainerTabState).volumeInfoRows] as ContainerTabState['volumeInfoRows'])
        : containerDefaults.volumeInfoRows,
      containerRows: Array.isArray((blob.container as { containerRows?: unknown }).containerRows)
        ? ([...(blob.container as unknown as ContainerTabState).containerRows] as ContainerTabState['containerRows'])
        : containerDefaults.containerRows,
    };
    const marksDefaults = emptyMarksDescriptionState();
    const marksRaw = blob.marks as unknown as MarksDescriptionTabState;
    const marks: MarksDescriptionTabState = {
      ...marksDefaults,
      ...marksRaw,
      sellingLines: Array.isArray(marksRaw.sellingLines) ? [...marksRaw.sellingLines] : marksDefaults.sellingLines,
    };
    const freightDefaults = emptyFreightState();
    const freightRaw = blob.freight as unknown as FreightTabState;
    const freight: FreightTabState = {
      ...freightDefaults,
      ...freightRaw,
      sellingRows: Array.isArray(freightRaw.sellingRows) ? [...freightRaw.sellingRows] : freightDefaults.sellingRows,
      buyingRows: Array.isArray(freightRaw.buyingRows) ? [...freightRaw.buyingRows] : freightDefaults.buyingRows,
      payOnBehalfRows: Array.isArray(freightRaw.payOnBehalfRows)
        ? [...freightRaw.payOnBehalfRows]
        : freightDefaults.payOnBehalfRows,
    };
    return { topBar, header, container, marks, freight };
  } catch {
    return null;
  }
}
