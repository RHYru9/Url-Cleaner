document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

document.getElementById('urls').addEventListener('input', updateStats);

function isValidDomainPure(domain) {
    if (!domain || typeof domain !== 'string') return false;
    
    domain = domain.toLowerCase().trim();
    
    if (domain.length === 0 || domain.length > 253) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;
    
    const labels = domain.split('.');
    if (labels.length < 2) return false;
    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        
        if (label.length === 0 || label.length > 63) return false;
        if (!/^[a-z0-9-]+$/.test(label)) return false;
        if (label.startsWith('-') || label.endsWith('-')) return false;
        if (i === labels.length - 1) {
            if (label.length < 2) return false;
            if (/^\d+$/.test(label)) return false;
            if (!/[a-z]/.test(label)) return false;
        }
    }
    
    return true;
}

function isValidDomainNative(domain) {
    if (!domain) return false;
    
    try {
        const url = new URL('http://' + domain);
        const hostname = url.hostname;
        
        if (!hostname) return false;
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
            return false;
        }
        
        if (!hostname.includes('.')) return false;
        
        return hostname === domain.toLowerCase();
        
    } catch (error) {
        return false;
    }
}

function isValidDomainAdvanced(domain) {
    if (!domain) return false;
    
    domain = domain.toLowerCase().trim();
    
    if (!isValidDomainPure(domain)) return false;
    
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    const secondLevel = parts.length > 1 ? parts[parts.length - 2] : '';
    
    if (!isValidTLDPattern(tld)) return false;
    if (hasSuspiciousPattern(domain)) return false;
    
    return true;
}

function isValidTLDPattern(tld) {
    if (!tld || tld.length < 2) return false;
    
    const letterCount = (tld.match(/[a-z]/g) || []).length;
    const totalLength = tld.length;
    
    if (letterCount / totalLength < 0.5) return false;
    if (/^\d+$/.test(tld)) return false; // All numbers
    if (tld.length > 10) return false; // Too long for typical TLD
    
    return true;
}

function hasSuspiciousPattern(domain) {
    const parts = domain.split('.');
    if (parts.length > 6) return true; // Too many subdomains
    if (domain.includes('--')) return true; // Double hyphens
    if (domain.includes('.-') || domain.includes('-.')) return true; // Hyphen near dot
    
    return false;
}
function extractRootDomainDynamic(url) {
    if (!url) return '';
    
    try {
        let domain = url.replace(/^https?:\/\//, '')
                       .replace(/^www\./, '')
                       .split('/')[0]
                       .split('?')[0]
                       .split('#')[0]
                       .split(':')[0];

        if (!isValidDomainAdvanced(domain)) return '';
        
        const parts = domain.split('.');
        
        if (parts.length <= 2) return domain;
        
        return extractRootUsingHeuristics(parts);
        
    } catch (error) {
        return '';
    }
}

function extractRootUsingHeuristics(parts) {
    const tld = parts[parts.length - 1];
    const secondLevel = parts[parts.length - 2];
    const thirdLevel = parts.length > 2 ? parts[parts.length - 3] : '';
    
    if (secondLevel.length <= 3 && thirdLevel) {
        if (isLikelyMultiPartTLD(secondLevel, tld)) {
            return parts.slice(-3).join('.');
        }
    }
    
    if (isSecondLevelTLDPattern(secondLevel)) {
        return parts.slice(-3).join('.');
    }
    
    return parts.slice(-2).join('.');
}

function isLikelyMultiPartTLD(secondLevel, tld) {
    if (secondLevel.length > 4) return false;
    
    if (secondLevel.length === 2 && /^[a-z]{2}$/.test(secondLevel)) {
        return true; // Likely country code second level
    }
    
    if (/^(ltd|inc|llc|pvt|pty)$/.test(secondLevel)) {
        return true;
    }
    
    return false;
}

function isSecondLevelTLDPattern(secondLevel) {
    if (secondLevel.length === 2 && /^[a-z]{2}$/.test(secondLevel)) {
        return true;
    }
    
    const functionalPatterns = [
        /^ac$/, /^co$/, /^or$/, /^ne$/, /^go$/,
        /^ed$/, /^mi$/, /^in$/
    ];
    
    return functionalPatterns.some(pattern => pattern.test(secondLevel));
}

function isValidDomain(domain, options = {}) {
    const {
        allowIP = false,
        requireNetwork = false,
        strictMode = true
    } = options;
    
    if (!domain) return false;

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        return allowIP ? validateIPAddress(domain) : false;
    }

    if (strictMode) {
        if (!isValidDomainAdvanced(domain)) return false;
    } else {
        if (!isValidDomainPure(domain)) return false;
    }
    
    return true;
}

// Helper: IP validation
function validateIPAddress(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255 && part === num.toString();
    });
}

function isValidUrl(url) {
    if (!url) return false;
    
    url = sanitizeUrl(url);
    
    const hasProtocol = /^https?:\/\//i.test(url);
    const domainPattern = /^(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/i;
    const ipPattern = /^(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?$/;
    const localhostPattern = /^(?:https?:\/\/)?localhost(?::\d+)?(?:\/[^\s]*)?$/i;
    
    return domainPattern.test(url) || ipPattern.test(url) || localhostPattern.test(url);
}

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let cleaned = url.replace(/[^\x20-\x7E]/g, '');
    
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '').trim();
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
}

function extractDomain(url) {
    if (!url) return null;
    
    try {
        url = sanitizeUrl(url);
        
        let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
        
        domain = domain.split(':')[0];
        
        if (domain && (domain.includes('.') || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain))) {
            return domain;
        }
        return null;
    } catch {
        return null;
    }
}

function extractRootDomain(url) {
    return extractRootDomainDynamic(url);
}

function extractTLD(domain) {
    if (!domain) return '';
    
    // Clean domain first
    domain = sanitizeUrl(domain);
    
    const parts = domain.split('.');
    if (parts.length < 2) return '';
    
    const rootDomain = extractRootDomainDynamic(domain);
    if (!rootDomain) return '';
    
    const rootParts = rootDomain.split('.');
    return rootParts[rootParts.length - 1];
}

function extractBaseEndpoint(url) {
    if (!url) return '';
    
    try {
        url = sanitizeUrl(url);
        
        let cleanUrl = url.replace(/^https?:\/\//, '');
        let [domainPart, ...pathParts] = cleanUrl.split('/');
        
        if (pathParts.length === 0) {
            return domainPart;
        }
        
        let fullPath = pathParts.join('/');
        
        fullPath = fullPath.split('?')[0].split('#')[0];
        
        let basePath = fullPath
            .replace(/\/\d+\/?$/, '')
            .replace(/\/\d+\//g, '/')
            .replace(/\/[a-zA-Z_]*id[=_]\d+/gi, '')
            .replace(/([a-zA-Z_]+)\d+(\.[a-zA-Z]+)$/, '$1$2')
            .replace(/\/+/g, '/')
            .replace(/\/$/, '');
        
        return domainPart + (basePath ? '/' + basePath : '');
    } catch {
        return url;
    }
}

function normalizeUrl(url) {
    if (!url) return '';
    
    try {
        url = sanitizeUrl(url);
        
        let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        let [domain, ...pathParts] = cleanUrl.split('/');
        let path = pathParts.join('/');
        
        let [pathOnly, query] = path.split('?');
        
        let normalizedPath = pathOnly.split('/').map(segment => {
            if (/^\d+$/.test(segment)) {
                return '{id}';
            }
            if (/^[a-z0-9]{8,}$/i.test(segment)) {
                return '{uid}';
            }
            if (/^(id|user_id|item_id|product_id)[=_]\d+$/i.test(segment)) {
                return segment.replace(/\d+$/, '{id}');
            }
            return segment;
        }).join('/');
        
        let normalizedQuery = '';
        if (query) {
            let params = new URLSearchParams(query);
            let normalizedParams = [];
            
            params.forEach((value, key) => {
                if (/^\d+$/.test(value)) {
                    normalizedParams.push(`${key}={num}`);
                } else if (/^[a-f0-9]{8,}$/i.test(value)) {
                    normalizedParams.push(`${key}={hash}`);
                } else {
                    normalizedParams.push(`${key}={val}`);
                }
            });
            
            normalizedQuery = '?' + normalizedParams.join('&');
        }
        
        return domain + (normalizedPath ? '/' + normalizedPath : '') + normalizedQuery;
    } catch {
        return url;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleFilterControls() {
    const filterControls = document.getElementById('filterControls');
    if (filterControls.style.display === 'none') {
        filterControls.style.display = 'block';
    } else {
        filterControls.style.display = 'none';
    }
}

function getUrls() {
    let input = document.getElementById("urls").value.trim();
    
    return input.split('\n')
        .map(url => sanitizeUrl(url))
        .filter(url => url && url.length > 0);
}

function getCleanedUrls() {
    let input = document.getElementById("cleanedUrls").value.trim();
    return input.split('\n')
        .map(url => sanitizeUrl(url))
        .filter(url => url && url.length > 0);
}

function getDomainListFromTextarea(textareaId) {
    const input = document.getElementById(textareaId).value.trim();
    return input.split('\n')
        .map(line => sanitizeUrl(line.trim()))
        .filter(line => line.length > 0)
        .map(domain => {
            return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        });
}

function updateStats() {
    const input = document.getElementById("urls").value.trim();
    const lines = input.split('\n')
        .map(line => sanitizeUrl(line.trim()))
        .filter(line => line.length > 0);
    
    const validUrls = lines.filter(line => isValidUrl(line));
    const domains = [...new Set(lines.map(line => extractRootDomain(line)).filter(Boolean))];
    
    document.getElementById('totalLines').textContent = lines.length;
    document.getElementById('validUrls').textContent = validUrls.length;
    document.getElementById('uniqueDomains').textContent = domains.length;
}

function cleanUrls() {
    const urls = getUrls();
    let cleanedUrls = [...new Set(urls.map(url => {
        return extractDomain(url);
    }).filter(Boolean))];
    
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast(`Cleaned ${cleanedUrls.length} unique domains from ${urls.length} URLs`);
}

function cleanUrlsWithPaths() {
    const urls = getUrls();
    const normalizedMap = new Map();
    
    urls.forEach(url => {
        const normalized = normalizeUrl(url);
        if (!normalizedMap.has(normalized)) {
            normalizedMap.set(normalized, url);
        }
    });
    
    const uniqueUrls = Array.from(normalizedMap.values());
    
    document.getElementById("cleanedUrls").value = uniqueUrls.join('\n');
    showToast(`Normalized ${urls.length} URLs, found ${uniqueUrls.length} unique patterns`);
}

function removeEndpointDuplicates() {
    const urls = getUrls();
    const endpointMap = new Map();
    
    urls.forEach(url => {
        const baseEndpoint = extractBaseEndpoint(url);
        if (baseEndpoint && !endpointMap.has(baseEndpoint)) {
            endpointMap.set(baseEndpoint, url);
        }
    });
    
    const uniqueUrls = Array.from(endpointMap.values());
    
    document.getElementById("cleanedUrls").value = uniqueUrls.join('\n');
    showToast(`Removed ${urls.length - uniqueUrls.length} endpoint duplicates, ${uniqueUrls.length} unique endpoints remaining`);
}

function addHttps() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => {
        url = sanitizeUrl(url);
        url = url.replace(/^https?:\/\//, '');
        return url.startsWith('https://') ? url : "https://" + url;
    });
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Added HTTPS to all URLs');
}

function addHttp() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => {
        url = sanitizeUrl(url);
        url = url.replace(/^https?:\/\//, '');
        return url.startsWith('http://') ? url : "http://" + url;
    });
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Added HTTP to all URLs');
}

function removeProtocols() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => url.replace(/^https?:\/\//, ''));
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Removed all protocols');
}

function removeWww() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => url.replace(/^(https?:\/\/)?(www\.)/i, '$1'));
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Removed WWW from all URLs');
}

function addWww() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => {
        if (url.match(/^https?:\/\//i)) {
            return url.replace(/^(https?:\/\/)((?!www\.))/i, '$1www.');
        } else {
            return url.startsWith('www.') ? url : 'www.' + url;
        }
    });
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Added WWW to all URLs');
}

function removeDuplicates() {
    const urls = getUrls();
    let cleanedUrls = [...new Set(urls)];
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast(`Removed ${urls.length - cleanedUrls.length} duplicates`);
}

function extractDomains() {
    const urls = getUrls();
    let cleanedUrls = [...new Set(urls.map(url => {
        return extractRootDomain(url);
    }).filter(Boolean))];
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast(`Extracted ${cleanedUrls.length} unique root domains`);
}

function sortUrls() {
    const urls = getUrls();
    let cleanedUrls = urls.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('URLs sorted alphabetically');
}

function validateUrls() {
    const urls = getUrls();
    let validUrls = urls.filter(url => isValidUrl(url));
    let invalidCount = urls.length - validUrls.length;
    document.getElementById("cleanedUrls").value = validUrls.join('\n');
    showToast(`Found ${validUrls.length} valid URLs, removed ${invalidCount} invalid`);
}

function addSlash() {
    const urls = getUrls();
    let cleanedUrls = urls.map(url => {

        if (url.includes('?') || url.includes('#')) {
            return url;
        }
        return url.endsWith('/') ? url : url + '/';
    });
    document.getElementById("cleanedUrls").value = cleanedUrls.join('\n');
    showToast('Added trailing slash to URLs without query/fragment');
}

function clearAll() {
    if (confirm('Are you sure you want to clear all content?')) {
        document.getElementById("urls").value = '';
        document.getElementById("cleanedUrls").value = '';
        document.getElementById("includeDomains").value = '';
        document.getElementById("excludeDomains").value = '';
        updateStats();
        showToast('All content cleared');
    }
}

function copyResults() {
    const results = document.getElementById("cleanedUrls");
    results.select();
    results.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(results.value).then(() => {
        showToast('Results copied to clipboard!');
    }).catch(() => {
        document.execCommand('copy');
        showToast('Results copied to clipboard!');
    });
}

function downloadResults() {
    const results = document.getElementById("cleanedUrls").value;
    if (!results.trim()) {
        showToast('No results to download');
        return;
    }
    const blob = new Blob([results], {
        type: 'text/plain'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-urls-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Results downloaded successfully!');
}

function extractTLDs() {
    const urls = getUrls();
    let tlds = [...new Set(urls.map(url => {
        const domain = extractDomain(url);
        return domain ? extractTLD(domain) : null;
    }).filter(Boolean))];
    document.getElementById("cleanedUrls").value = tlds.join('\n');
    showToast(`Extracted ${tlds.length} unique TLDs`);
}

function groupByTLD() {
    const urls = getUrls();
    const grouped = {};
    urls.forEach(url => {
        const domain = extractDomain(url);
        if (domain) {
            const tld = extractTLD(domain);
            if (!grouped[tld]) {
                grouped[tld] = [];
            }
            grouped[tld].push(domain);
        }
    });
    let result = [];
    Object.keys(grouped).sort().forEach(tld => {
        result.push(`=== .${tld} ===`);
        result.push(...[...new Set(grouped[tld])].sort());
        result.push('');
    });
    document.getElementById("cleanedUrls").value = result.join('\n');
    showToast(`Grouped domains by ${Object.keys(grouped).length} TLD types`);
}

function countResults() {
    const results = document.getElementById("cleanedUrls").value.trim();
    const count = results ? results.split('\n').filter(line => line.trim()).length : 0;
    showToast(`Results contain ${count} lines`);
}

function applyIncludeFilter() {
    const includeDomains = getDomainListFromTextarea('includeDomains');
    if (includeDomains.length === 0) {
        showToast('Please enter domains to include');
        return;
    }
    
    const urls = getCleanedUrls();
    const filteredUrls = urls.filter(url => {
        const domain = extractDomain(url);
        return domain && includeDomains.some(included => 
            domain === included || domain.endsWith('.' + included)
        );
    });
    
    document.getElementById("cleanedUrls").value = filteredUrls.join('\n');
    showToast(`Filtered to ${filteredUrls.length} URLs matching include list`);
}

function applyExcludeFilter() {
    const excludeDomains = getDomainListFromTextarea('excludeDomains');
    if (excludeDomains.length === 0) {
        showToast('Please enter domains to exclude');
        return;
    }
    
    const urls = getCleanedUrls();
    const filteredUrls = urls.filter(url => {
        const domain = extractDomain(url);
        return !domain || !excludeDomains.some(excluded => 
            domain === excluded || domain.endsWith('.' + excluded)
        );
    });
    
    document.getElementById("cleanedUrls").value = filteredUrls.join('\n');
    showToast(`Filtered to ${filteredUrls.length} URLs not in exclude list`);
}

function clearIncludeFilter() {
    document.getElementById('includeDomains').value = '';
}

function clearExcludeFilter() {
    document.getElementById('excludeDomains').value = '';
}

//duplicate path 
function removePathCaseDuplicates() {
    const urls = getUrls();
    const pathMap = new Map();
    
    urls.forEach(url => {
        let normalized = url.toLowerCase()
                           .replace(/^[\/\\]+|[\/\\]+$/g, '')
                           .replace(/[\/\\]+/g, '/');
        
        const parts = normalized.split('/');
        if (parts.length > 1 && parts[0].includes('-')) {
            normalized = parts[0];
        }
        
        if (!pathMap.has(normalized)) {
            let cleanUrl = url.replace(/^[\/\\]+|[\/\\]+$/g, '').replace(/[\/\\]+/g, '/');
            

            const urlParts = cleanUrl.split('/');
            if (urlParts.length > 1 && urlParts[0].includes('-')) {
                cleanUrl = urlParts[0];
            }
            
            pathMap.set(normalized, cleanUrl);
        }
    });
    
    const uniqueUrls = Array.from(pathMap.values());
    document.getElementById("cleanedUrls").value = uniqueUrls.join('\n');
    showToast(`Removed ${urls.length - uniqueUrls.length} case-sensitive path duplicates`);
}

updateStats();
