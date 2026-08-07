import { describe, expect, it } from 'vitest';
import { createSharpenKernel, resolveImageSharpenConfig } from './imageSharpenConfig';

describe('imageSharpenConfig', () => {
    it('根据锐化强度生成守恒的卷积矩阵', () => {
        expect(createSharpenKernel(0.5)).toBe('0 -0.5 0 -0.5 3 -0.5 0 -0.5 0');
        expect(createSharpenKernel(1)).toBe('0 -1 0 -1 5 -1 0 -1 0');
    });

    it('将配置限制在声明的有效范围内', () => {
        expect(resolveImageSharpenConfig({
            strength: 3,
            contrast: 0.8,
            brightness: 1.2,
        })).toEqual({
            strength: 2,
            contrast: 1,
            brightness: 1.05,
        });
    });
});
