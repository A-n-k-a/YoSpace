import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlayerHeader from './PlayerHeader';

vi.mock('next/image', () => ({
  default: React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }
  >(function MockImage({ unoptimized, alt = '', ...props }, ref) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={ref} alt={alt} data-unoptimized={String(Boolean(unoptimized))} {...props} />;
  }),
}));

describe('PlayerHeader', () => {
  it('音乐封面使用 HTTPS 原始地址并跳过 Next 图片优化', () => {
    render(
      <PlayerHeader
        currentTrack={{
          id: 1,
          name: '测试歌曲',
          ar: [{ name: '测试歌手' }],
          al: { name: '测试专辑', picUrl: 'http://i.scdn.co/cover.jpg' },
        }}
        onClose={vi.fn()}
      />
    );

    const cover = screen.getByAltText('Cover');
    expect(cover).toHaveAttribute('src', 'https://i.scdn.co/cover.jpg');
    expect(cover).toHaveAttribute('data-unoptimized', 'true');
    expect(cover.getAttribute('src')).not.toContain('/_next/image');
  });
});
