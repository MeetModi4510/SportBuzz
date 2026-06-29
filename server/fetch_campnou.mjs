// Fetch Camp Nou entity data using correct QID: Q159848
const url = 'https://www.wikidata.org/wiki/Special:EntityData/Q159848.json';

fetch(url, { headers: { 'User-Agent': 'StadiumDataFetcher/1.0', 'Accept': 'application/json' } })
.then(r => r.json())
.then(async data => {
    const entity = data.entities['Q159848'];
    const claims = entity.claims;

    const getClaimValues = (prop) => {
        if (!claims[prop]) return null;
        return claims[prop].map(c => {
            const dv = c.mainsnak?.datavalue;
            if (!dv) return null;
            if (dv.type === 'quantity') return dv.value.amount;
            if (dv.type === 'time') return dv.value.time;
            if (dv.type === 'string') return dv.value;
            if (dv.type === 'wikibase-entityid') return `Q${dv.value['numeric-id']}`;
            if (dv.type === 'globecoordinate') return `${dv.value.latitude}, ${dv.value.longitude}`;
            return null;
        }).filter(Boolean);
    };

    const raw = {
        name: entity.labels?.en?.value,
        capacity: getClaimValues('P1083'),
        opened: getClaimValues('P571'),
        surface: getClaimValues('P789'),
        city: getClaimValues('P131'),
        country: getClaimValues('P17'),
        coordinates: getClaimValues('P625'),
        image: getClaimValues('P18'),
        architect: getClaimValues('P84'),
        tenants: getClaimValues('P115'),
        website: getClaimValues('P856'),
        named_after: getClaimValues('P138'),
        owner: getClaimValues('P127'),
        operator: getClaimValues('P137'),
    };

    // Collect all QIDs to resolve
    const allQids = [];
    ['surface','city','country','architect','tenants','named_after','owner','operator'].forEach(k => {
        (raw[k] || []).forEach(v => { if(v.startsWith('Q')) allQids.push(v); });
    });

    const uniqueQids = [...new Set(allQids)];
    const batchUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${uniqueQids.join('|')}&props=labels&languages=en&format=json`;
    const labelData = await fetch(batchUrl).then(r => r.json());

    const labelMap = {};
    Object.entries(labelData.entities || {}).forEach(([qid, ent]) => {
        labelMap[qid] = ent.labels?.en?.value || qid;
    });

    const resolve = (arr) => arr ? arr.map(v => v.startsWith('Q') ? labelMap[v] || v : v) : null;

    console.log('\n========== CAMP NOU - DATA FROM WIKIDATA ==========\n');
    console.log(`Name:        ${raw.name}`);
    console.log(`Capacity:    ${raw.capacity?.[0] ? parseInt(raw.capacity[0]).toLocaleString() : 'N/A'}`);
    console.log(`Opened:      ${raw.opened?.[0]?.substring(1,5) || 'N/A'}`);
    console.log(`Coordinates: ${raw.coordinates?.[0] || 'N/A'}`);
    console.log(`City:        ${resolve(raw.city)?.join(', ') || 'N/A'}`);
    console.log(`Country:     ${resolve(raw.country)?.join(', ') || 'N/A'}`);
    console.log(`Surface:     ${resolve(raw.surface)?.join(', ') || 'N/A'}`);
    console.log(`Architect:   ${resolve(raw.architect)?.join(', ') || 'N/A'}`);
    console.log(`Tenants:     ${resolve(raw.tenants)?.join(', ') || 'N/A'}`);
    console.log(`Owner:       ${resolve(raw.owner)?.join(', ') || 'N/A'}`);
    console.log(`Operator:    ${resolve(raw.operator)?.join(', ') || 'N/A'}`);
    console.log(`Website:     ${raw.website?.[0] || 'N/A'}`);
    console.log(`Named After: ${resolve(raw.named_after)?.join(', ') || 'N/A'}`);
    console.log(`\nImage (Wikimedia Commons filename):`);
    (raw.image || []).forEach(img => console.log(`  - ${img}`));
    console.log('\n====================================================');
})
.catch(err => console.error('Error:', err));
