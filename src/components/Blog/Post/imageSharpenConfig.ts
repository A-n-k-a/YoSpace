export interface ImageSharpenConfig {
    strength: number;
    contrast: number;
    brightness: number;
}

/**
 * 正文图片锐化参数统一控制项。
 *
 * 修改这里即可同步调整正文图片和灯箱预览图片，无需改动 SVG 或 CSS。
 */
export const IMAGE_SHARPEN_CONFIG: ImageSharpenConfig = {
    /**
     * 卷积锐化强度，有效范围 0～2，当前值 1。
     * 0 表示不进行卷积锐化；数值越大，文字和边缘越清晰，同时噪点也会更明显。
     */
    strength: 1,

    /**
     * 图片对比度，有效范围 1～1.2，当前值 1.1。
     * 1 表示保持原始对比度；数值越大，明暗和边缘反差越明显。
     */
    contrast: 0.9,

    /**
     * 图片亮度补偿，有效范围 0.95～1.05，当前值 1.02。
     * 1 表示保持原始亮度；小于 1 变暗，大于 1 变亮。
     */
    brightness: 1,
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

export const resolveImageSharpenConfig = (config = IMAGE_SHARPEN_CONFIG): ImageSharpenConfig => {
    return {
        strength: clamp(config.strength, 0, 2),
        contrast: clamp(config.contrast, 1, 1.2),
        brightness: clamp(config.brightness, 0.95, 1.05),
    };
};

export const createSharpenKernel = (strength: number) => {
    const safeStrength = clamp(strength, 0, 2);
    const center = 1 + safeStrength * 4;

    return [
        0, -safeStrength, 0,
        -safeStrength, center, -safeStrength,
        0, -safeStrength, 0,
    ].join(' ');
};
