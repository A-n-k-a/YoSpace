import React from 'react';
import styles from './ImageSharpenFilter.module.css';
import { createSharpenKernel, resolveImageSharpenConfig } from './imageSharpenConfig';

export const IMAGE_SHARPEN_FILTER_ID = 'blog-image-sharpen';

/**
 * 正文图片共用的 SVG 锐化滤镜定义。
 *
 * 该组件仅声明浏览器原生卷积滤镜，不参与图片像素计算。
 */
const ImageSharpenFilter: React.FC = () => {
    const { strength } = resolveImageSharpenConfig();

    return (
        <svg
            className={styles.definition}
            width="0"
            height="0"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <filter
                    id={IMAGE_SHARPEN_FILTER_ID}
                    x="-10%"
                    y="-10%"
                    width="120%"
                    height="120%"
                    colorInterpolationFilters="sRGB"
                >
                    <feConvolveMatrix
                        order="3"
                        kernelMatrix={createSharpenKernel(strength)}
                        divisor="1"
                        bias="0"
                        edgeMode="duplicate"
                        preserveAlpha="true"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default ImageSharpenFilter;
