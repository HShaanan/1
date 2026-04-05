export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export function createBusinessUrl(slug: string) {
    return `/business/${encodeURIComponent(slug)}`;
}
