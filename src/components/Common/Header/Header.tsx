"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillSun, AiFillMoon, AiFillHome } from "react-icons/ai";
import { FaLink, FaBook, FaBars, FaTags, FaFolderOpen, FaArchive, FaRss } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { MdOutlineDesktopWindows, MdTranslate } from "react-icons/md";
import { profile } from "../../../profile";
import style from "./Header.module.css";
import { useI18n } from "@/context/I18nContext";

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

const DEFAULT_PREFERENCE: ThemePreference = 'system';

interface ThemeState {
  preference: ThemePreference;
  resolved: Theme;
}

let themeState: ThemeState = { preference: DEFAULT_PREFERENCE, resolved: 'light' };
const themeListeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

const resolveTheme = (preference: ThemePreference): Theme => {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const readPreferredTheme = (): ThemePreference => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCE;
  const saved = window.localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'system';
};

const emitThemeChange = () => {
  themeListeners.forEach((listener) => listener());
};

const syncResolvedTheme = () => {
  const resolved = resolveTheme(themeState.preference);
  if (themeState.resolved === resolved) return;
  themeState = { ...themeState, resolved };
  emitThemeChange();
};

const onSystemThemeChange = () => {
  if (themeState.preference === 'system') {
    syncResolvedTheme();
  }
};

const setThemePreference = (nextPreference: ThemePreference) => {
  if (themeState.preference === nextPreference) return;
  themeState = { preference: nextPreference, resolved: resolveTheme(nextPreference) };

  if (typeof window !== 'undefined') {
    if (nextPreference === 'system') {
      window.localStorage.removeItem('theme');
    } else {
      window.localStorage.setItem('theme', nextPreference);
    }
  }

  emitThemeChange();
};

const onThemeStorage = (event: StorageEvent) => {
  if (event.key !== 'theme') return;
  const preference = readPreferredTheme();
  themeState = { preference, resolved: resolveTheme(preference) };
  emitThemeChange();
};

const subscribeTheme = (listener: () => void) => {
  themeListeners.add(listener);
  if (themeListeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('storage', onThemeStorage);
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onSystemThemeChange);
  }

  return () => {
    themeListeners.delete(listener);
    if (themeListeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', onThemeStorage);
      mediaQuery?.removeEventListener('change', onSystemThemeChange);
      mediaQuery = null;
    }
  };
};

const getThemeStateSnapshot = () => themeState;
const SERVER_THEME_STATE: ThemeState = { preference: DEFAULT_PREFERENCE, resolved: 'light' };
const getThemeStateServerSnapshot = () => SERVER_THEME_STATE;

/**
 * 顶部导航栏组件
 * 
 * 包含网站Logo、导航链接、主题切换和语言切换功能。
 * 响应式设计，支持滚动时改变样式。
 */
const Header: React.FC = () => {
  const pathname = usePathname();
  const currentPath = pathname;
  const { t, locale, setLocale } = useI18n();

  // 博客外部链接配置
  const blogMode = process.env.NEXT_PUBLIC_BLOG_MODE;
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;
  const isI18nEnabled = process.env.NEXT_PUBLIC_I18N !== 'false';

  const currentThemeState = useSyncExternalStore(subscribeTheme, getThemeStateSnapshot, getThemeStateServerSnapshot);
  const themePreference = currentThemeState.preference;
  const theme = currentThemeState.resolved;
  const [isMenuOpenState, setIsMenuOpenState] = useState<{ isOpen: boolean; path: string }>(() => {
    return { isOpen: false, path: pathname || '' };
  });

  const isMenuOpen = isMenuOpenState.isOpen && isMenuOpenState.path === (pathname || '');

  useEffect(() => {
    const preference = readPreferredTheme();
    const resolved = resolveTheme(preference);
    if (themeState.preference === preference && themeState.resolved === resolved) return;
    themeState = { preference, resolved };
    emitThemeChange();
  }, []);

  // 监听主题变化并应用到 body
  useEffect(() => {
    document.body.className = theme;
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // 滚动状态管理
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // 当滚动超过 50px 时，设置为 true
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const themeGroupRef = useRef<HTMLDivElement | null>(null);
  
  // 切换主题处理函数
  const handleThemeToggle = (preference: ThemePreference) => {
    setThemePreference(preference);
  };

  // 切换语言处理函数
  const handleLanguageToggle = () => {
    setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  // 切换移动端菜单
  const toggleMenu = () => {
    const current = pathname || '';
    setIsMenuOpenState((prev) => {
      const shouldOpen = !(prev.isOpen && prev.path === current);
      return { isOpen: shouldOpen, path: current };
    });
  };

  // 关闭移动端菜单
  const closeMenu = () => {
    setIsMenuOpenState({ isOpen: false, path: pathname || '' });
  };

  // 移动端切换语言
  const handleMobileLanguageToggle = () => {
    handleLanguageToggle();
    closeMenu();
  };

  // 移动端切换主题
  const handleMobileThemeToggle = (preference: ThemePreference) => {
    handleThemeToggle(preference);
    closeMenu();
  };

  // 获取当前语言对应的导航标题
  const navTitle = locale === 'en-US'
    ? (process.env.NEXT_PUBLIC_NAV_TITLE_EN || profile.navTitle)
    : profile.navTitle;

  return (
    <nav className={`${style.nav} ${isScrolled ? style.scrolled : ''}`}>
      <div className={style.nav_wrapper}>
        <div className={style.nav_title}>
          <Link className={style.nav_logo} href="/">{navTitle}</Link>
        </div>

        <div className={style.nav_itemsList}>
          <Link className={`${style.nav_item} ${currentPath === '/' ? style.active : ''}`} href='/'>
            <AiFillHome /> {t('Pages.Home')}
          </Link>
          {(blogMode === 'external' && blogUrl) ? (
            <a 
              className={`${style.nav_item}`} 
              href={blogUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaBook /> {t('Pages.Blog')}
            </a>
          ) : (
            <Link className={`${style.nav_item} ${currentPath.startsWith('/blog') ? style.active : ''}`} href='/blog'>
              <FaBook /> {t('Pages.Blog')}
            </Link>
          )}
          <Link className={`${style.nav_item} ${currentPath === '/archive' ? style.active : ''}`} href='/archive'>
            <FaArchive /> {t('Archive.Title')}
          </Link>
          <Link className={`${style.nav_item} ${currentPath === '/tags' ? style.active : ''}`} href='/tags'>
            <FaTags /> {t('Pages.Tags')}
          </Link>
          <Link className={`${style.nav_item} ${currentPath === '/categories' ? style.active : ''}`} href='/categories'>
            <FaFolderOpen /> {t('Pages.Categories')}
          </Link>
          <Link className={`${style.nav_item} ${currentPath === '/links' ? style.active : ''}`} href='/links'>
            <FaLink /> {t('Pages.Links')}
          </Link>
          <Link className={`${style.nav_item} ${currentPath === '/subscribe' ? style.active : ''}`} href='/subscribe'>
            <FaRss /> {t('Pages.Subscribe')}
          </Link>
          {isI18nEnabled && (
            <button 
              className={`${style.nav_item} ${style.nav_toggle}`}  
              onClick={handleLanguageToggle}
              type="button"
              aria-label={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
              title={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
            >
              <MdTranslate />
            </button>
          )}
          <div
            className={style.theme_group}
            ref={themeGroupRef}
            role="group"
            aria-label={t('Theme.Label')}
          >
            <button
              className={`${style.nav_item} ${style.nav_toggle} ${themePreference === 'light' ? style.nav_toggle_active : ''}`}
              onClick={() => handleThemeToggle('light')}
              type="button"
              aria-pressed={themePreference === 'light'}
              title={t('Theme.Light')}
              aria-label={t('Theme.Light')}
            >
              <AiFillSun />
            </button>
            <button
              className={`${style.nav_item} ${style.nav_toggle} ${themePreference === 'system' ? style.nav_toggle_active : ''}`}
              onClick={() => handleThemeToggle('system')}
              type="button"
              aria-pressed={themePreference === 'system'}
              title={t('Theme.System')}
              aria-label={t('Theme.System')}
            >
              <MdOutlineDesktopWindows />
            </button>
            <button
              className={`${style.nav_item} ${style.nav_toggle} ${themePreference === 'dark' ? style.nav_toggle_active : ''}`}
              onClick={() => handleThemeToggle('dark')}
              type="button"
              aria-pressed={themePreference === 'dark'}
              title={t('Theme.Dark')}
              aria-label={t('Theme.Dark')}
            >
              <AiFillMoon />
            </button>
          </div>
        </div>

        <button 
            className={style.hamburger} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
        >
            {isMenuOpen ? <FiX /> : <FaBars />}
        </button>

        <div 
            className={`${style.mobile_menu} ${isMenuOpen ? style.mobile_menu_open : ''}`}
            onClick={closeMenu}
        >
            <div 
                className={style.mobile_menu_items}
                onClick={(event) => event.stopPropagation()}
            >
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/' ? style.active : ''}`} 
                  href='/' 
                  onClick={closeMenu}
                >
                  <AiFillHome /> {t('Pages.Home')}
                </Link>
                {(blogMode === 'external' && blogUrl) ? (
                  <a 
                    className={`${style.mobile_nav_item}`} 
                    href={blogUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    <FaBook /> {t('Pages.Blog')}
                  </a>
                ) : (
                  <Link 
                    className={`${style.mobile_nav_item} ${currentPath.startsWith('/blog') ? style.active : ''}`} 
                    href='/blog'
                    onClick={closeMenu}
                  >
                    <FaBook /> {t('Pages.Blog')}
                  </Link>
                )}
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/archive' ? style.active : ''}`} 
                  href='/archive'
                  onClick={closeMenu}
                >
                  <FaArchive /> {t('Archive.Title')}
                </Link>
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/tags' ? style.active : ''}`} 
                  href='/tags'
                  onClick={closeMenu}
                >
                  <FaTags /> {t('Pages.Tags')}
                </Link>
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/categories' ? style.active : ''}`} 
                  href='/categories'
                  onClick={closeMenu}
                >
                  <FaFolderOpen /> {t('Pages.Categories')}
                </Link>
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/links' ? style.active : ''}`} 
                  href='/links'
                  onClick={closeMenu}
                >
                  <FaLink /> {t('Pages.Links')}
                </Link>
                <Link 
                  className={`${style.mobile_nav_item} ${currentPath === '/subscribe' ? style.active : ''}`} 
                  href='/subscribe'
                  onClick={closeMenu}
                >
                  <FaRss /> {t('Pages.Subscribe')}
                </Link>
                
                <div className={style.mobile_controls}>
                    {isI18nEnabled && (
                        <button 
                            className={style.mobile_control_btn}  
                            onClick={handleMobileLanguageToggle}
                            type="button"
                        >
                            <MdTranslate /> {locale === 'zh-CN' ? 'English' : '中文'}
                        </button>
                    )}
                    <div className={style.mobile_theme_group} role="group" aria-label={t('Theme.Label')}>
                        <button
                            className={`${style.mobile_theme_btn} ${themePreference === 'light' ? style.mobile_theme_btn_active : ''}`}
                            onClick={() => handleMobileThemeToggle('light')}
                            type="button"
                            aria-pressed={themePreference === 'light'}
                            aria-label={t('Theme.Light')}
                        >
                            <AiFillSun />
                            {themePreference === 'light' && <span>{t('Theme.Light')}</span>}
                        </button>
                        <button
                            className={`${style.mobile_theme_btn} ${themePreference === 'system' ? style.mobile_theme_btn_active : ''}`}
                            onClick={() => handleMobileThemeToggle('system')}
                            type="button"
                            aria-pressed={themePreference === 'system'}
                            aria-label={t('Theme.System')}
                        >
                            <MdOutlineDesktopWindows />
                            {themePreference === 'system' && <span>{t('Theme.System')}</span>}
                        </button>
                        <button
                            className={`${style.mobile_theme_btn} ${themePreference === 'dark' ? style.mobile_theme_btn_active : ''}`}
                            onClick={() => handleMobileThemeToggle('dark')}
                            type="button"
                            aria-pressed={themePreference === 'dark'}
                            aria-label={t('Theme.Dark')}
                        >
                            <AiFillMoon />
                            {themePreference === 'dark' && <span>{t('Theme.Dark')}</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
