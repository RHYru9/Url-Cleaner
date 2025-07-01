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
    
    // TLD should be mostly letters
    const letterCount = (tld.match(/[a-z]/g) || []).length;
    const totalLength = tld.length;
    
    // At least 50% should be letters
    if (letterCount / totalLength < 0.5) return false;
    
    // Common invalid patterns
    if (/^\d+$/.test(tld)) return false; // All numbers
    if (tld.length > 10) return false; // Too long for typical TLD
    
    return true;
}

// Helper: Check for suspicious domain patterns
function hasSuspiciousPattern(domain) {
    // Check for excessive subdomains
    const parts = domain.split('.');
    if (parts.length > 6) return true; // Too many subdomains
    
    // Check for suspicious characters or patterns
    if (domain.includes('--')) return true; // Double hyphens
    if (domain.includes('.-') || domain.includes('-.')) return true; // Hyphen near dot
    
    return false;
}

// METHOD 6: Extract Root Domain Without Static TLD List
function extractRootDomainDynamic(url) {
    if (!url) return '';
    
    try {
        // Clean URL
        let domain = url.replace(/^https?:\/\//, '')
                       .replace(/^www\./, '')
                       .split('/')[0]
                       .split('?')[0]
                       .split('#')[0]
                       .split(':')[0];
        
        // Validate domain first
        if (!isValidDomainAdvanced(domain)) return '';
        
        const parts = domain.split('.');
        
        // If only 2 parts, it's already root domain
        if (parts.length <= 2) return domain;
        
        // For 3+ parts, use heuristics to determine root domain
        return extractRootUsingHeuristics(parts);
        
    } catch (error) {
        return '';
    }
}

// Helper: Extract root domain using heuristics
function extractRootUsingHeuristics(parts) {
    const tld = parts[parts.length - 1];
    const secondLevel = parts[parts.length - 2];
    const thirdLevel = parts.length > 2 ? parts[parts.length - 3] : '';
    
    // Heuristic 1: Length-based detection
    // Short second-level domains often indicate multi-part TLD
    if (secondLevel.length <= 3 && thirdLevel) {
        // Check if it looks like a multi-part TLD
        if (isLikelyMultiPartTLD(secondLevel, tld)) {
            return parts.slice(-3).join('.');
        }
    }
    
    // Heuristic 2: Pattern-based detection
    // Common patterns for second-level TLDs
    if (isSecondLevelTLDPattern(secondLevel)) {
        return parts.slice(-3).join('.');
    }
    
    // Default: assume single TLD
    return parts.slice(-2).join('.');
}

// Helper: Detect multi-part TLD without static list
function isLikelyMultiPartTLD(secondLevel, tld) {
    // Length heuristic
    if (secondLevel.length > 4) return false;
    
    // Pattern heuristic - short, common abbreviations
    if (secondLevel.length === 2 && /^[a-z]{2}$/.test(secondLevel)) {
        return true; // Likely country code second level
    }
    
    // Common business/organization patterns
    if (/^(ltd|inc|llc|pvt|pty)$/.test(secondLevel)) {
        return true;
    }
    
    return false;
}

// Helper: Detect second-level TLD patterns
function isSecondLevelTLDPattern(secondLevel) {
    // Geographic indicators
    if (secondLevel.length === 2 && /^[a-z]{2}$/.test(secondLevel)) {
        return true;
    }
    
    // Functional indicators (short functional words)
    const functionalPatterns = [
        /^ac$/, /^co$/, /^or$/, /^ne$/, /^go$/,  // Common abbreviations
        /^ed$/, /^mi$/, /^in$/                    // Education, military, info
    ];
    
    return functionalPatterns.some(pattern => pattern.test(secondLevel));
}

// FINAL IMPLEMENTATION: Complete validation function
function isValidDomain(domain, options = {}) {
    const {
        allowIP = false,
        requireNetwork = false,
        strictMode = true
    } = options;
    
    if (!domain) return false;
    
    // IP address check
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        return allowIP ? validateIPAddress(domain) : false;
    }
    
    // Basic validation
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

// URL VALIDATION FUNCTIONS
function isValidUrl(url) {
    if (!url) return false;
    
    // Sanitize first
    url = sanitizeUrl(url);
    
    // Basic check for protocol
    const hasProtocol = /^https?:\/\//i.test(url);
    
    // Check for valid domain pattern
    const domainPattern = /^(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/i;
    
    // Check for IP address pattern
    const ipPattern = /^(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?$/;
    
    // Check for localhost
    const localhostPattern = /^(?:https?:\/\/)?localhost(?::\d+)?(?:\/[^\s]*)?$/i;
    
    return domainPattern.test(url) || ipPattern.test(url) || localhostPattern.test(url);
}

// Enhanced URL sanitization - removes all non-ASCII characters, emojis, unicode symbols
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    
    // Remove all unicode characters, emojis, and special symbols
    // Keep only ASCII printable characters (32-126) plus some extended ASCII
    let cleaned = url.replace(/[^\x20-\x7E]/g, '');
    
    // Remove extra whitespace and control characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '').trim();
    
    // Remove multiple consecutive spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
}

// DOMAIN EXTRACTION FUNCTIONS
function extractDomain(url) {
    if (!url) return null;
    
    try {
        // Sanitize URL first
        url = sanitizeUrl(url);
        
        let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
        
        // Remove port if present
        domain = domain.split(':')[0];
        
        // Validate if it's a proper domain
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
    
    // Use our advanced domain validation to determine the TLD
    const rootDomain = extractRootDomainDynamic(domain);
    if (!rootDomain) return '';
    
    const rootParts = rootDomain.split('.');
    return rootParts[rootParts.length - 1];
}

// URL PROCESSING FUNCTIONS
function extractBaseEndpoint(url) {
    if (!url) return '';
    
    try {
        // Sanitize URL first
        url = sanitizeUrl(url);
        
        // Parse URL to get components
        let cleanUrl = url.replace(/^https?:\/\//, '');
        let [domainPart, ...pathParts] = cleanUrl.split('/');
        
        if (pathParts.length === 0) {
            return domainPart;
        }
        
        let fullPath = pathParts.join('/');
        
        // Remove query parameters and fragments
        fullPath = fullPath.split('?')[0].split('#')[0];
        
        // Remove numeric IDs and common parameter patterns
        let basePath = fullPath
            // Remove trailing numeric IDs like /123, /456
            .replace(/\/\d+\/?$/, '')
            // Remove numeric IDs in the middle like /path/123/subpath -> /path/subpath
            .replace(/\/\d+\//g, '/')
            // Remove common ID patterns like /id=123, /user_id=456
            .replace(/\/[a-zA-Z_]*id[=_]\d+/gi, '')
            // Remove file extensions with numbers like file123.php -> file.php
            .replace(/([a-zA-Z_]+)\d+(\.[a-zA-Z]+)$/, '$1$2')
            // Clean up multiple slashes
            .replace(/\/+/g, '/')
            // Remove trailing slash if present
            .replace(/\/$/, '');
        
        return domainPart + (basePath ? '/' + basePath : '');
    } catch {
        return url;
    }
}

function normalizeUrl(url) {
    if (!url) return '';
    
    try {
        // Sanitize URL first
        url = sanitizeUrl(url);
        
        // Remove protocol and www
        let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        // Split into domain and path
        let [domain, ...pathParts] = cleanUrl.split('/');
        let path = pathParts.join('/');
        
        // Process path and query parameters
        let [pathOnly, query] = path.split('?');
        
        // Normalize path segments
        let normalizedPath = pathOnly.split('/').map(segment => {
            // Replace numeric segments
            if (/^\d+$/.test(segment)) {
                return '{id}';
            }
            // Replace alphanumeric IDs
            if (/^[a-z0-9]{8,}$/i.test(segment)) {
                return '{uid}';
            }
            // Replace common ID patterns
            if (/^(id|user_id|item_id|product_id)[=_]\d+$/i.test(segment)) {
                return segment.replace(/\d+$/, '{id}');
            }
            return segment;
        }).join('/');
        
        // Normalize query parameters
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
        
        // Reconstruct normalized URL
        return domain + (normalizedPath ? '/' + normalizedPath : '') + normalizedQuery;
    } catch {
        return url;
    }
}

// UI HELPER FUNCTIONS
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

// DATA PROCESSING FUNCTIONS
function getUrls() {
    let input = document.getElementById("urls").value.trim();
    
    // Split by newlines and sanitize each URL
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
            // Remove protocol and www if present
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

// MAIN TOOL FUNCTIONS
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
        // Don't add slash if there's a query or fragment
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

updateStats();
