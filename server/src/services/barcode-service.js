import bwipjs from 'bwip-js';

export function buildConsumableBarcode(consumableId) {
  return `ITEM:${consumableId}`;
}

export function buildLocationBarcode(locationCode) {
  return `LOC:${locationCode}`;
}

export async function renderBarcodePng(text) {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });
}
