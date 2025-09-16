import { toPng } from 'html-to-image';

export async function exportShareCardPNG(rootId = 'share-card-root', fileName = 'trysnowball-share.png') {
  const el = document.getElementById(rootId);
  if (!el) throw new Error('Share card root not found');
  
  const dataUrl = await toPng(el, {
    pixelRatio: 2, // crisp
    cacheBust: true,
    skipFonts: false,
    style: { transform: 'none' } // avoid scaled parents
  });
  
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
  return dataUrl;
}

export async function copyShareCardToClipboard(rootId = 'share-card-root') {
  const el = document.getElementById(rootId);
  if (!el) throw new Error('Share card root not found');
  
  const dataUrl = await toPng(el, { 
    pixelRatio: 2, 
    cacheBust: true,
    skipFonts: false,
    style: { transform: 'none' }
  });
  
  const blob = await (await fetch(dataUrl)).blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

export function buildShareCopy(milestone) {
  // Minimal, non-PII, punchy
  if (milestone?.type === 'debt_cleared') {
    const debtName = milestone.debtLabel || milestone.debtName || 'Debt';
    return { 
      headline: `Goodbye, ${debtName} 👋`, 
      stat: `${debtName} cleared`, 
      subline: 'On to the next one' 
    };
  }
  
  if (milestone?.type === 'chunk_paid') {
    return { 
      headline: 'Progress drop 💥', 
      stat: `£${milestone.amount?.toLocaleString() || '500'} wiped`, 
      subline: 'Keeping the momentum' 
    };
  }
  
  if (milestone?.type === 'snowball_growth') {
    return { 
      headline: 'Snowball growing ❄️', 
      stat: `+£${milestone.delta || '50'}`, 
      subline: 'More firepower each month' 
    };
  }
  
  if (milestone?.type === 'halfway_point') {
    return {
      headline: 'Halfway there! 🏔️',
      stat: '50% complete',
      subline: 'The momentum is building'
    };
  }
  
  if (milestone?.type === 'first_payment') {
    return {
      headline: 'Journey started 🎯',
      stat: 'First payment made',
      subline: 'Every step counts'
    };
  }
  
  // fallback
  return { 
    headline: 'Wins add up', 
    stat: 'Another step closer', 
    subline: 'Debt-free journey in progress' 
  };
}

export function buildShareCaption(milestone) {
  const { headline, stat, subline } = buildShareCopy(milestone);
  return `${headline} — ${stat}. ${subline} #DebtFree #Snowball #FinancialFreedom trysnowball.co.uk`;
}