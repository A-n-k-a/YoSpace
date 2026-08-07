import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarkdownImageLightbox, { getLongPressDelay, getPointerDistance } from './MarkdownImageLightbox';

vi.mock('next/image', () => ({
    default: React.forwardRef<
        HTMLImageElement,
        React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }
    >(function MockImage({ priority, unoptimized, alt = '', ...props }, ref) {
        void priority;
        void unoptimized;
        // eslint-disable-next-line @next/next/no-img-element
        return <img ref={ref} alt={alt} {...props} />;
    }),
}));

const renderLightbox = () => render(
    <MarkdownImageLightbox
        src="/test-image.png"
        alt="测试图片"
        width={700}
        height={400}
    />
);

const setElementDimensions = (dialog: HTMLElement, image: HTMLElement) => {
    Object.defineProperties(dialog, {
        clientWidth: { configurable: true, value: 1200 },
        clientHeight: { configurable: true, value: 800 },
    });
    Object.defineProperties(image, {
        offsetWidth: { configurable: true, value: 700 },
        offsetHeight: { configurable: true, value: 400 },
    });
};

afterEach(() => {
    vi.useRealTimers();
});

describe('MarkdownImageLightbox', () => {
    it('点击正文图片后打开，再次点击预览图片后关闭', async () => {
        const user = userEvent.setup();
        renderLightbox();

        await user.click(screen.getByRole('button', { name: '查看大图：测试图片' }));
        const dialog = screen.getByRole('dialog', { name: '测试图片 图片预览' });
        expect(dialog).toBeInTheDocument();

        await user.click(within(dialog).getByAltText('测试图片'));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('点击蒙版区域能够关闭预览', () => {
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        fireEvent.click(screen.getByRole('dialog'));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('支持 Escape 和关闭按钮关闭预览', async () => {
        const user = userEvent.setup();
        renderLightbox();

        await user.click(screen.getByRole('button', { name: '查看大图：测试图片' }));
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '查看大图：测试图片' }));
        await user.click(screen.getByRole('button', { name: '关闭图片预览' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('鼠标滚轮能够缩放图片，并锁定页面滚动', async () => {
        const user = userEvent.setup();
        renderLightbox();

        await user.click(screen.getByRole('button', { name: '查看大图：测试图片' }));
        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.wheel(dialog, { deltaY: -100 });
        expect(previewImage).toHaveStyle({ transform: 'translate3d(0px, 0px, 0) scale(1.2)' });
    });

    it('正确计算双指间距', () => {
        expect(getPointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('按输入设备设置不同的长按判定时间', () => {
        expect(getLongPressDelay('mouse')).toBe(180);
        expect(getLongPressDelay('touch')).toBe(0);
    });

    it('PC 端放大后支持鼠标长按拖动', () => {
        vi.useFakeTimers();
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        setElementDimensions(dialog, previewImage);
        fireEvent.wheel(dialog, { deltaY: -100 });
        fireEvent.pointerDown(dialog, {
            pointerId: 1,
            pointerType: 'mouse',
            button: 0,
            clientX: 400,
            clientY: 300,
        });
        act(() => vi.advanceTimersByTime(getLongPressDelay('mouse')));
        fireEvent.pointerMove(dialog, {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 450,
            clientY: 340,
        });

        expect(previewImage).toHaveStyle({ transform: 'translate3d(50px, 40px, 0) scale(1.2)' });
    });

    it('触摸屏支持双指缩放', () => {
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        setElementDimensions(dialog, previewImage);
        fireEvent.pointerDown(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 300,
            clientY: 300,
        });
        fireEvent.pointerDown(dialog, {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 400,
            clientY: 300,
        });
        fireEvent.pointerMove(dialog, {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 500,
            clientY: 300,
        });

        expect(previewImage).toHaveStyle({ transform: 'translate3d(0px, 0px, 0) scale(2)' });
    });

    it('触摸屏放大后支持单指直接拖动', () => {
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        setElementDimensions(dialog, previewImage);
        fireEvent.wheel(dialog, { deltaY: -100 });
        fireEvent.pointerDown(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 400,
            clientY: 300,
        });
        fireEvent.pointerMove(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 1400,
            clientY: 1000,
        });

        expect(previewImage).toHaveStyle({ transform: 'translate3d(1000px, 700px, 0) scale(1.2)' });
    });

    it('触摸屏双击按固定层级循环缩放', () => {
        vi.useFakeTimers();
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        setElementDimensions(dialog, previewImage);

        const touchTap = () => {
            fireEvent.pointerDown(previewImage, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 600,
                clientY: 400,
            });
            fireEvent.pointerUp(previewImage, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 600,
                clientY: 400,
            });
        };
        const touchDoubleTap = () => {
            touchTap();
            act(() => vi.advanceTimersByTime(100));
            touchTap();
        };

        [2, 3, 4, 3, 2, 1, 2].forEach((expectedScale) => {
            touchDoubleTap();
            expect(previewImage.style.transform).toContain(`scale(${expectedScale})`);
        });
    });

    it('触摸屏单击图片延迟关闭，单击蒙版立即关闭', () => {
        vi.useFakeTimers();
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        let dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        fireEvent.pointerDown(previewImage, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 600,
            clientY: 400,
        });
        fireEvent.pointerUp(previewImage, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 600,
            clientY: 400,
        });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(280));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));
        dialog = screen.getByRole('dialog');
        fireEvent.pointerDown(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 20,
            clientY: 20,
        });
        fireEvent.pointerUp(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 20,
            clientY: 20,
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('双击缩放重新计算屏幕中心对应的图片位置', () => {
        vi.useFakeTimers();
        renderLightbox();
        fireEvent.click(screen.getByRole('button', { name: '查看大图：测试图片' }));

        const dialog = screen.getByRole('dialog');
        const previewImage = within(dialog).getByAltText('测试图片');
        setElementDimensions(dialog, previewImage);
        for (let index = 0; index < 5; index += 1) {
            fireEvent.wheel(dialog, { deltaY: -100 });
        }
        fireEvent.pointerDown(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 400,
            clientY: 300,
        });
        fireEvent.pointerMove(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 500,
            clientY: 380,
        });
        fireEvent.pointerUp(dialog, {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 500,
            clientY: 380,
        });

        vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 1200,
            height: 800,
        } as DOMRect);
        vi.spyOn(previewImage, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 80,
            width: 1400,
            height: 800,
        } as DOMRect);

        const touchTap = () => {
            fireEvent.pointerDown(previewImage, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 600,
                clientY: 400,
            });
            fireEvent.pointerUp(previewImage, {
                pointerId: 1,
                pointerType: 'touch',
                clientX: 600,
                clientY: 400,
            });
        };
        touchTap();
        act(() => vi.advanceTimersByTime(100));
        touchTap();

        expect(previewImage).toHaveStyle({ transform: 'translate3d(150px, 120px, 0) scale(3)' });
    });
});
