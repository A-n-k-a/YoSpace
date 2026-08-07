import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ImageSharpenFilter, { IMAGE_SHARPEN_FILTER_ID } from './ImageSharpenFilter';

describe('ImageSharpenFilter', () => {
    it('声明正文图片共用的 3x3 锐化卷积矩阵', () => {
        const { container } = render(<ImageSharpenFilter />);
        const filter = container.querySelector(`#${IMAGE_SHARPEN_FILTER_ID}`);
        const matrix = filter?.querySelector('feConvolveMatrix');

        expect(filter).toHaveAttribute('color-interpolation-filters', 'sRGB');
        expect(matrix).toHaveAttribute('order', '3');
        expect(matrix).toHaveAttribute('kernelMatrix', '0 -1 0 -1 5 -1 0 -1 0');
        expect(matrix).toHaveAttribute('edgeMode', 'duplicate');
        expect(matrix).toHaveAttribute('preserveAlpha', 'true');
    });
});
