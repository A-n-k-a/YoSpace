import { describe, expect, it } from 'vitest';
import {
    shouldProxyMarkdownImageSrc,
    toProxiedMarkdownImageSrc,
    transformMarkdownUrl,
    isMarkdownBadgeImageSrc,
} from './markdownUtils';

describe('transformMarkdownUrl', () => {
    it('removes javascript urls', () => {
        expect(transformMarkdownUrl('javascript:alert(1)')).toBe('');
    });

    it('normalizes https urls', () => {
        expect(transformMarkdownUrl('https://skillicons.dev/icons?i=react')).toBe('https://skillicons.dev/icons?i=react');
    });
});

describe('markdown image proxy helpers', () => {
    it('proxies skillicons images', () => {
        const src = 'https://skillicons.dev/icons?i=react';

        expect(shouldProxyMarkdownImageSrc(src)).toBe(true);
        expect(toProxiedMarkdownImageSrc(src)).toBe('/api/image-proxy?url=https%3A%2F%2Fskillicons.dev%2Ficons%3Fi%3Dreact');
    });

    it('proxies shields badges', () => {
        const src = 'https://img.shields.io/badge/GitHub-WavesMan-FFB6C1?style=flat&logo=github';

        expect(shouldProxyMarkdownImageSrc(src)).toBe(true);
        expect(isMarkdownBadgeImageSrc(src)).toBe(true);
    });

    it('does not proxy non-whitelisted or non-https images', () => {
        expect(shouldProxyMarkdownImageSrc('https://example.com/image.png')).toBe(false);
        expect(shouldProxyMarkdownImageSrc('http://skillicons.dev/icons?i=react')).toBe(false);
        expect(shouldProxyMarkdownImageSrc('/local/image.png')).toBe(false);
    });
});
