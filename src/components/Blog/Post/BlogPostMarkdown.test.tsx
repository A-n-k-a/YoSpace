import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlogPostMarkdown } from './BlogPostMarkdown';

vi.mock('next/image', () => ({
    default: React.forwardRef<
        HTMLImageElement,
        React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }
    >(function MockImage({ priority, unoptimized, alt = '', ...props }, ref) {
        void priority;
        // eslint-disable-next-line @next/next/no-img-element
        return <img ref={ref} alt={alt} data-unoptimized={String(Boolean(unoptimized))} {...props} />;
    }),
}));

describe('BlogPostMarkdown images', () => {
    it('普通正文图片使用原始地址并跳过 Next 图片优化', () => {
        const src = 'https://cloud.waveyo.cn/Cloud/example/blog-image.png';
        render(<BlogPostMarkdown content={`![示例图片](${src})`} locale="zh-CN" />);

        const image = screen.getByRole('button', { name: '查看大图：示例图片' });
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('data-unoptimized', 'true');
        expect(image.getAttribute('src')).not.toContain('/_next/image');
        expect(image.getAttribute('src')).not.toContain('/api/image-proxy');
    });

    it('徽章图片同样保持外部原始地址', () => {
        const src = 'https://img.shields.io/badge/test-test-blue';
        render(<BlogPostMarkdown content={`![测试徽章](${src})`} locale="zh-CN" />);

        const image = screen.getByAltText('测试徽章');
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('data-unoptimized', 'true');
    });
});
