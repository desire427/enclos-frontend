function parsePreDiagnostic(description = '') {
  const markers = Array.from(description.matchAll(/(?:^|\n)(Suggestions|Recommandations|Urgence)\s*:\s*/g));
  if (!markers.length) return { observation: description.trim() };

  const parsed = { observation: description.slice(0, markers[0].index).trim() };
  markers.forEach((marker, index) => {
    const start = marker.index + marker[0].length;
    const end = markers[index + 1]?.index ?? description.length;
    const value = description.slice(start, end).trim();
    if (marker[1] === 'Urgence') {
      parsed.urgence = value;
      return;
    }
    try {
      parsed[marker[1] === 'Suggestions' ? 'suggestions' : 'recommandations'] = JSON.parse(value);
    } catch {
      parsed[marker[1] === 'Suggestions' ? 'suggestions' : 'recommandations'] = [];
    }
  });
  return parsed;
}

export default function PreDiagnosticHistory({ description, result, compact = false }) {
  const parsed = parsePreDiagnostic(description || '');
  const data = result ? {
    ...parsed,
    suggestions: result.suggestions || [],
    recommandations: result.recommandations || [],
    urgence: result.urgence || '',
  } : parsed;
  const hasDetails = data.suggestions || data.recommandations || data.urgence;

  return (
    <div className={compact ? 'mt-1 space-y-1' : 'mt-3 space-y-3'}>
      {data.observation && <p className="text-[13px] leading-relaxed text-[#171310]/75"><span className="font-semibold text-[#171310]">Observation : </span>{data.observation}</p>}
      {hasDetails && data.urgence && <p className="text-xs"><span className="font-semibold">Urgence : </span><span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${data.urgence === 'élevée' ? 'bg-red-100 text-red-700' : data.urgence === 'faible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>{data.urgence}</span></p>}
      {!compact && data.suggestions?.length > 0 && <div>
        <h4 className="mb-1 text-xs font-semibold text-[#171310]">Pistes à vérifier</h4>
        <ul className="divide-y divide-[#E5E5E3]">{data.suggestions.map((suggestion, index) => <li key={`${suggestion.nom}-${index}`} className="py-2 first:pt-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span className="text-[13px] font-semibold text-[#171310]">{suggestion.nom}</span>{suggestion.niveau && <span className="text-[11px] text-[#171310]/50">Niveau : {suggestion.niveau}</span>}</div>
          {suggestion.justification && <p className="mt-1 text-xs leading-relaxed text-[#171310]/65">{suggestion.justification}</p>}
        </li>)}</ul>
      </div>}
      {!compact && data.recommandations?.length > 0 && <div>
        <h4 className="mb-1 text-xs font-semibold text-[#171310]">Recommandations</h4>
        <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#171310]/70">{data.recommandations.map((recommendation, index) => <li key={index}>{typeof recommendation === 'string' ? recommendation : recommendation.nom}</li>)}</ul>
      </div>}
      {!hasDetails && !data.observation && <p className="text-[12px] text-[#171310]/60">Aucun détail disponible.</p>}
    </div>
  );
}