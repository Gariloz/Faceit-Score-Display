// ==UserScript==
// @name         Faceit Score Display
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Отображение счета матча в отдельном окне с настройками шрифта, звуком и автообновлением
// @author       Gariloz
// @match        https://*.faceit.com/*
// @grant        window.open
// @updateURL    https://github.com/Gariloz/Faceit-Score-Display/raw/main/Faceit-Score-Display.user.js
// @downloadURL  https://github.com/Gariloz/Faceit-Score-Display/raw/main/Faceit-Score-Display.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // КОНФИГУРАЦИЯ
    // ============================================================================
    
    const CONFIG = {
        // ============================
        // РАЗМЕРЫ POPUP ОКНА
        // ============================
        POPUP_WIDTH: 400,              // Ширина окна в закрытом виде
        POPUP_HEIGHT: 300,             // Высота окна в закрытом виде
        POPUP_WIDTH_OPEN: 320,         // Ширина окна при открытии
        POPUP_HEIGHT_OPEN: 220,        // Высота окна при открытии
        
        // ============================
        // ИНТЕРВАЛЫ ОБНОВЛЕНИЯ (в мс)
        // ============================
        UPDATE_INTERVAL: 50,           // Интервал обновления счета (меньше = чаще обновление)
        FAST_CHECK_INTERVAL: 50,       // Интервал быстрой проверки (меньше = чаще проверка)
        POPUP_KEEP_ALIVE_INTERVAL: 50, // Интервал проверки popup (меньше = чаще проверка)
        MATCH_PAGE_LOAD_DELAY: 1000,   // Задержка после загрузки страницы матча (в мс) - ЛОКАЛЬНАЯ для findScores()
        
        // ============================
        // ЗВУКОВЫЕ УВЕДОМЛЕНИЯ
        // ============================
        AUDIO_UNLOCK_DELAY: 50,        // Задержка разблокировки аудио
        SOUND_URL: 'https://cdn-frontend.faceit-cdn.net/web-next/_next/static/media/found-tone-silly.mp3', // URL звука
        SOUND_ENABLED: false,          // Включить звук по умолчанию (true/false)
        
        // ============================
        // АВТОПЕРЕЗАГРУЗКА СТРАНИЦЫ
        // ============================
        AUTO_RELOAD_MIN_MS: 50,        // Минимальная задержка автоперезагрузки (в мс)
        AUTO_RELOAD_ENABLED: false,    // Включить автоперезагрузку по умолчанию (true/false)
        AUTO_RELOAD_SECONDS: 300,      // Интервал автоперезагрузки в секундах
        
        // ============================
        // СТИЛИ КНОПКИ
        // ============================
        BUTTON_PADDING: '10px 20px',   // Отступы внутри кнопки
        BUTTON_TOP: '10px',            // Отступ сверху (меняйте для изменения позиции)
        BUTTON_RIGHT: '70px',          // Отступ справа (меняйте для изменения позиции)
        BUTTON_Z_INDEX: '2147483647',  // Z-index кнопки (поверх всех элементов)
        BUTTON_BORDER_RADIUS: '5px',   // Скругление углов кнопки
        BUTTON_BOX_SHADOW: '0 2px 5px rgba(0, 0, 0, 0.3)', // Тень кнопки
        BUTTON_FONT_SIZE: '14px',      // Размер шрифта кнопки
        BUTTON_GAP: '6px',             // Отступ между элементами кнопки
        
        // Настройки иконки глаза
        EYE_ICON_SIZE: '12px',                  // Размер иконки глаза (px)
        EYE_ICON_PADDING: '2px 4px',            // Отступы иконки глаза
        EYE_ICON_BG_COLOR_ACTIVE: 'rgba(244, 67, 54, 0.8)', // Цвет фона когда скрипт активен (красный)
        EYE_ICON_BG_COLOR_INACTIVE: 'rgba(76, 175, 80, 0.8)', // Цвет фона когда скрипт неактивен (зеленый)
        EYE_ICON_BORDER: '1px solid rgba(255, 255, 255, 0.5)', // Обводка иконки глаза
        EYE_ICON_BORDER_RADIUS: '3px',          // Скругление иконки глаза
        EYE_ICON_BG_HOVER: 'rgba(0, 0, 0, 0.5)', // Цвет фона при наведении
        EYE_ICON_BORDER_HOVER: 'rgba(255, 255, 255, 0.8)', // Цвет обводки при наведении
        
        // Настройки маленькой иконки (когда кнопка скрыта)
        HIDE_BUTTON_SIZE: '30px',                // Размер маленькой иконки (px)
        HIDE_BUTTON_FONT_SIZE: '18px',          // Размер шрифта маленькой иконки
        HIDE_BUTTON_BG_ACTIVE: 'rgba(244, 67, 54, 0.9)',   // Фон когда скрипт активен (красный)
        HIDE_BUTTON_BG_INACTIVE: 'rgba(76, 175, 80, 0.9)', // Фон когда скрипт неактивен (зеленый)
        HIDE_BUTTON_BORDER: '2px solid rgba(255, 255, 255, 0.6)', // Обводка маленькой иконки
        HIDE_BUTTON_OPACITY: '0.8',             // Прозрачность маленькой иконки
        HIDE_BUTTON_OPACITY_HOVER: '1',         // Прозрачность при наведении
        
        // ============================
        // СТИЛИ POPUP
        // ============================
        POPUP_PADDING: '8px',          // Отступы внутри popup
        POPUP_GAP: 8,                  // Расстояние между элементами в popup
        SCORE_FONT_SIZE: '60px',       // Размер шрифта счета в popup
        TIME_FONT_SIZE: '24px',        // Размер шрифта времени в popup
        TIME_MARGIN: '8px 0',          // Отступы времени
        ROW_MARGIN: '6px 0',           // Отступы рядов
        ROW_FONT_SIZE: '14px',         // Размер шрифта рядов
        INPUT_WIDTH: '90px',           // Ширина input полей
        INPUT_MARGIN: '6px',           // Отступы input полей
        AUTO_RELOAD_WIDTH: '80px',     // Ширина поля автоперезагрузки
        FONT_SIZE: 60,                 // Размер шрифта по умолчанию (число, без px)
        
        // ============================
        // МОНИТОРИНГ ВКЛАДОК
        // ============================
        TAB_PRIORITY_ENABLED: true,              // Включить систему приоритетов вкладок (true/false)
        INACTIVE_TAB_ENABLED: true,              // Включить мониторинг неактивных вкладок (true/false)
        INACTIVE_TAB_CHECK_INTERVAL: 50,         // Интервал проверки неактивных вкладок (в мс)
        // INACTIVE_DATA_TTL удален - данные хранятся бессрочно
        AGGRESSIVE_MONITORING: true,             // Включить агрессивный мониторинг (true/false)
        BACKGROUND_SYNC_INTERVAL: 50,            // Интервал синхронизации в фоне (в мс)
        BACKGROUND_SYNC_DELAY: 2000,             // Задержка синхронизации в фоне (в мс)
        
        // ============================
        // ДОПОЛНИТЕЛЬНЫЕ ТЕХНОЛОГИИ
        // ============================
        WEB_WORKER_ENABLED: true,                // Включить Web Worker (true/false)
        WEB_WORKER_INTERVAL: 1000,               // Интервал Web Worker (в мс)
        INTERSECTION_OBSERVER_ENABLED: true,     // Включить Intersection Observer (true/false)
        DOM_EVENTS_ENABLED: true,                // Включить DOM события (true/false)
        TITLE_FLASH_DELAY: 10,                   // Задержка мигания заголовка (в мс)
        DOM_TRANSFORM_DELAY: 10,                 // Задержка DOM трансформации (в мс)
        POPUP_UPDATE_DELAY: 100,                 // Задержка обновления popup (в мс)
        
        // ============================
        // URL ПАТТЕРНЫ ДЛЯ МАТЧЕЙ
        // ============================
        MATCH_URL_PATTERNS: ['/match/', '/csgo/room/', '/room/'] // Паттерны URL страниц матчей
    };

    const SELECTORS = {
        SCORE_ELEMENTS: [
            'h3.FactionsDetails__FactionScore-sc-dfad5944-8',
            'h3[class*="FactionsDetails__FactionScore-sc-"]',
            'h3[class*="FactionScore-sc-"]',
            'h3[class*="FactionsDetails__FactionScore"]',
            'h3[class*="HeadingBase"][class*="FactionsDetails__FactionScore"]',
            'h3[class*="HeadingBase"][class*="FactionScore"]',
            'h3[class*="MatchScore__"]',
            '.score-display h3',
            '[data-testid="team-score"]',
            '[class*="styles__"] h3',
            '[class*="sc-"] h3',
            'h3[class*="Score"]',
            'h3[class*="Team"]',
            'h3[class*="Match"]',
            'h3[class*="Faction"]',
            'h1, h2, h3, h4, h5, h6'
        ],
        
        TIME_ELEMENTS: [
            '.Tooltip__TriggerContainer-sc-1f7e13b3-2.cBmBHn',
            '.FactionsDetails__Details-sc-e6de407-1 .Tooltip__TriggerContainer-sc-1f7e13b3-2',
            '.FactionsDetails__Details-sc-e6de407-1 .cBmBHn',
            '.FactionsDetails__Details-sc-e6de407-1 .Tooltip__Holder-sc-1f7e13b3-0 .Tooltip__TriggerContainer-sc-1f7e13b3-2',
            '.FactionsDetails__Details-sc-e6de407-1 .kbUkqz .Tooltip__TriggerContainer-sc-1f7e13b3-2',
            '.FactionsDetails__Details-sc-e6de407-1 .UYLrF .cBmBHn',
            '.Ready__Container-sc-47e4e9d7-0 .styles__CountdownContainer-sc-733a6e3-5',
            '[class*="Ready__Container"] [class*="CountdownContainer"]',
            '[class*="Ready__Container"] h5[class*="HeadingBase"]',
            '[class*="Ready__Container"] h5',
            '[class*="CountdownContainer"]',
            '[class*="Ready__"] h5',
            '[class*="Ready__"] [class*="Countdown"]',
            '[class*="styles__CountdownContainer"]',
            '[class*="Countdown"]',
            '.Tooltip__Holder-sc-1f7e13b3-0 .Tooltip__TriggerContainer-sc-1f7e13b3-2',
            '.Tooltip__TriggerContainer-sc-1f7e13b3-2.cBmBHn',
            '[class*="FactionsDetails__Details"] .Tooltip__TriggerContainer',
            '.Tooltip__TriggerContainer-sc-1f7e13b3-2',
            '[class*="Tooltip__TriggerContainer"]',
            '[class*="MatchTimer__"]',
            '[class*="Timer__"]',
            '.match-timer',
            '[data-testid="match-timer"]',
            '[class*="styles__"] .Tooltip__TriggerContainer',
            '[class*="sc-"] .Tooltip__TriggerContainer',
            '[class*="BottomStatusBarHolder"] .Tooltip__TriggerContainer',
            '[class*="ClickawayOverride"] .Tooltip__TriggerContainer',
            '[class*="ReactModal"] .Tooltip__TriggerContainer',
            '[class*="Tooltip"]',
            '[class*="Time"]',
            '[class*="Timer"]',
            '[class*="Clock"]',
            'div[class*="Text-sc-"] div[class*="Tooltip__TriggerContainer"]',
            'div[class*="kbUkqz"] div[class*="Tooltip__TriggerContainer"]',
            'div[class*="Tooltip__Holder"] div[class*="Tooltip__TriggerContainer"]',
            'div[class*="UYLrF"] div[class*="Tooltip__TriggerContainer"]',
            'div[class*="cBmBHn"]',
            '*[class*="Tooltip"]:not([class*="Info"])',
            'div:not([class*="Info"]):not([class*="Best"])',
            '[class*="FactionsDetails__Details-sc-"] .Tooltip__TriggerContainer',
            '[class*="FactionsDetails__Details-sc-"] div[class*="Tooltip__TriggerContainer"]',
            '[class*="FactionsDetails__Details-sc-"] .cBmBHn',
            '[class*="FactionsDetails__Details-sc-"] div[class*="cBmBHn"]',
            '[class*="FactionsDetails__Details-sc-"] div[class*="Text-sc-"]',
            '[class*="FactionsDetails__Details-sc-"] div[class*="kbUkqz"]'
        ],
        
        SCORE_CONTAINERS: [
            '.Header__Container-sc-a63b2439-0',
            '[class*="Header__Container-sc-"]',
            '.FactionsDetails__Container-sc-dfad5944-0',
            '[class*="FactionsDetails__Container-sc-"]',
            '[class*="FactionsDetails__Container"]',
            '[class*="Header__Container"]',
            '[class*="MatchHeader__"]',
            '.match-score-container',
            '[class*="Header__Wrapper-sc-"]',
            '.Header__Wrapper-sc-a63b2439-5',
            '[class*="FactionsDetails__Container-sc-e6de407-0"]',
            '[class*="FactionsDetails__Faction-sc-e6de407-2"]',
            '[class*="styles__"]',
            '[class*="sc-"]',
            '[class*="BottomStatusBarHolder"]',
            '[class*="ClickawayOverride"]',
            '[class*="ReactModal"]',
            'body'
        ],
        
        FALLBACK_CLASS_PATTERNS: [
            'FactionsDetails__',
            'MatchScore__',
            'TeamScore__',
            'HeadingBase',
            'Header__Wrapper'
        ],
        
        // Селекторы для поиска матча
        MATCH_SEARCH_TEXT: [
            'div.styles__ButtonTextWrapper-sc-a459ab75-7',
            'div[class*="ButtonTextWrapper"]',
            'div.styles__ButtonTextWrapper',
            'button[class*="ButtonTextWrapper"]',
            'div, button, span' // Fallback - поиск по тексту
        ],
        
        MATCH_SEARCH_TIMER: [
            'span[class*="CountDownWrapper"]',
            'span.styles__CountDownWrapper',
            'span.styles__CountDownWrapper-sc-a459ab75-8',
            'div[class*="CountDownWrapper"]',
            'span[class*="Timer"]',
            'div[class*="Timer"]'
        ],
        
        // Тексты, которые означают поиск/принятие матча
        MATCH_SEARCH_STATUSES: [
            'Finding match',
            'Finding Super Match',
            'Match accepted',
            'Joining match',
            'Connecting'
        ]
    };

    const STORAGE_KEYS = {
        FONT_SIZE: 'faceitScoreFontSize',
        SOUND: 'faceitScoreSound',
        AUTO_RELOAD_ENABLED: 'faceitScoreAutoReloadEnabled',
        AUTO_RELOAD_SECONDS: 'faceitScoreAutoReloadMs',
        SCRIPT_ACTIVE: 'faceitScoreScriptActive',
        POPUP_ALIVE: 'faceitScorePopupAlive',
        ACTIVE_TAB_URL: 'faceitScoreActiveTabUrl',
        INACTIVE_TAB_DATA: 'faceitScoreInactiveTabData',
        BUTTON_VISIBLE: 'faceitScoreButtonVisible'
    };

    // ============================================================================
    // ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    // ============================================================================

    let scoreWindow = null;
    let lastScore = null;
    let lastSoundScore = null;
    let isUpdating = false;
    let isScriptActive = false;
    let lastMatchPageTime = 0;
    let lastMatchPageUrl = '';
    
    // Таймеры и интервалы
    let updateInterval = null;
    let fastCheckInterval = null;
    let popupKeepAliveTimer = null;
    let autoReloadTimer = null;
    let inactiveTabTimer = null;
    let backgroundSyncTimer = null;
    let urlTrackingInterval = null;
    let domEventsTimer = null;
    
    // Web Worker и observers
    let webWorker = null;
    let webWorkerUrl = null;
    let intersectionObserver = null;
    
    // Кнопка и маленькая иконка
    let button = null;
    let hideButton = null; // Маленькая иконка глаза когда кнопка скрыта

    const scoreChannel = (typeof BroadcastChannel !== 'undefined') 
        ? new BroadcastChannel('faceit-score') 
        : null;

    // ============================================================================
    // ИНИЦИАЛИЗАЦИЯ НАСТРОЕК
    // ============================================================================

    function initializeSettings() {
        const defaults = {
            [STORAGE_KEYS.FONT_SIZE]: CONFIG.FONT_SIZE,
            [STORAGE_KEYS.SOUND]: CONFIG.SOUND_ENABLED ? '1' : '0',
            [STORAGE_KEYS.AUTO_RELOAD_ENABLED]: CONFIG.AUTO_RELOAD_ENABLED ? '1' : '0',
            [STORAGE_KEYS.AUTO_RELOAD_SECONDS]: CONFIG.AUTO_RELOAD_SECONDS
        };

        Object.entries(defaults).forEach(([key, value]) => {
            if (localStorage.getItem(key) === null) {
                localStorage.setItem(key, String(value));
            }
        });
    }
    
    initializeSettings();

    // ============================================================================
    // BROADCAST CHANNEL ОБРАБОТЧИКИ
    // ============================================================================

    if (scoreChannel) {
        scoreChannel.addEventListener('message', (e) => {
            if (e.data.type === 'settingsChanged') {
                applyAutoReloadPolicy();
                lastSoundScore = null;
            }
            
            if (e.data.type === 'requestTimeUpdate') {
                updateScore();
            }
            
            if (e.data.type === 'checkPopupAlive') {
                if (scoreWindow && !scoreWindow.closed) {
                    scoreChannel.postMessage({ type: 'popupAliveResponse' });
                }
            }
            
            if (e.data.type === 'popupAlive') {
                if (!isScriptActive && isPopupAliveViaStorage()) {
                    isScriptActive = true;
                    localStorage.setItem(STORAGE_KEYS.SCRIPT_ACTIVE, '1');
                    
                    const button = document.querySelector('button[style*="position: fixed"]');
                    if (button) {
                        updateButtonText('Скрыть счет', '#f44336');
                    }
                    
                    startUpdateInterval();
                    startPopupKeepAlive();
                    
                    setTimeout(() => {
                        startInactiveTabMonitoring();
                        startAggressiveMonitoring();
                        startAllAdvancedTricks();
                    }, 100);
                }
            }
            
            if (e.data.type === 'buttonUpdate') {
                const button = document.querySelector('button[style*="position: fixed"]');
                if (button && e.data.text && e.data.color) {
                    button.textContent = e.data.text;
                    button.style.backgroundColor = e.data.color;
                }
            }
            
            if (e.data.type === 'popupClosed' || e.data.type === 'forceClosePopup') {
                if (isScriptActive) {
                    try {
                        if (scoreWindow && !scoreWindow.closed) {
                            scoreWindow.close();
                        }
                    } catch {}
                    
                    try {
                        const popups = window.open('', 'ScoreWindow');
                        if (popups && !popups.closed) {
                            popups.close();
                        }
                    } catch {}
                    
                    stopUpdateInterval();
                    isScriptActive = false;
                    scoreWindow = null;
                    
                    localStorage.removeItem(STORAGE_KEYS.POPUP_ALIVE);
                    localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
                    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                    
                    const button = document.querySelector('button[style*="position: fixed"]');
                    if (button) {
                        updateButtonText('Показать счет', '#4CAF50', button);
                    }
                }
            }
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.AUTO_RELOAD_ENABLED || e.key === STORAGE_KEYS.AUTO_RELOAD_SECONDS) {
            applyAutoReloadPolicy();
        }
    });

    // ============================================================================
    // УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================================

    function getSettings() {
        return {
            fontSize: Number(localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || CONFIG.FONT_SIZE),
            soundEnabled: localStorage.getItem(STORAGE_KEYS.SOUND) === '1'
        };
    }

    function isPopupAlive() {
        try {
            if (scoreWindow && !scoreWindow.closed) {
                return true;
            }
            return isPopupAliveViaStorage();
        } catch {
            return false;
        }
    }

    function isPopupAliveViaStorage() {
        try {
            const alive = localStorage.getItem(STORAGE_KEYS.POPUP_ALIVE);
            return alive === '1';
        } catch {
            return false;
        }
    }

    function getCurrentTabUrl() {
        return window.location.href;
    }

    function isTabVisible() {
        return !document.hidden;
    }

    function parseMatchDuration(timeElement) {
        try {
            let tooltip = null;
            
            // Способ 1: Ищем в #tooltip-portal (где находятся активные тултипы)
            const tooltipPortal = document.getElementById('tooltip-portal');
            console.log('[Faceit Score] Tooltip portal найден:', !!tooltipPortal);
            if (tooltipPortal) {
                const portalTooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                console.log('[Faceit Score] Найдено тултипов в портале:', portalTooltips.length);
                for (const t of portalTooltips) {
                    const text = t.textContent || '';
                    console.log('[Faceit Score] Текст тултипа:', text.substring(0, 100));
                    if (text.includes('Started at') && text.includes('Finished at')) {
                        console.log('[Faceit Score] ✓ Нашли тултип с временем в портале!');
                        tooltip = t;
                        break;
                    }
                }
            }
            
            // Способ 2: Агрессивный поиск всех тултипов на странице
            if (!tooltip) {
                const allTooltips = document.querySelectorAll(
                    '[role="tooltip"], ' +
                    '.Tooltip__TooltipHolder-sc-1f7e13b3-1, ' +
                    '[class*="TooltipHolder"], ' +
                    '.TooltipContent__BaseContainer-sc-692903b7-0, ' +
                    '[class*="TooltipContent__BaseContainer"], ' +
                    '[class*="TooltipContent__TextsContainer"], ' +
                    '[class*="TooltipContent__PrimaryLabel"]'
                );
                for (const t of allTooltips) {
                    const text = t.textContent || '';
                    if (text.includes('Started at') && text.includes('Finished at')) {
                        tooltip = t;
                        break;
                    }
                }
            }
            
            // Способ 3: Ищем через родителя timeElement
            if (!tooltip && timeElement) {
                tooltip = timeElement.closest('[role="tooltip"]') || 
                         timeElement.closest('.Tooltip__TooltipHolder-sc-1f7e13b3-1') ||
                         timeElement.closest('[class*="TooltipHolder"]');
            }
            
            // Способ 4: Ищем в документе по тексту (с разными вариантами)
            if (!tooltip) {
                const allElements = document.querySelectorAll('div, span');
                for (const el of allElements) {
                    const text = el.textContent || '';
                    // Проверяем различные варианты (Mon, Пн, и т.д.)
                    if ((text.includes('Started at') && text.includes('Finished at')) && text.length < 300) {
                        tooltip = el;
                        break;
                    }
                }
            }
            
            if (!tooltip) {
                console.log('[Faceit Score] ✗ Тултип не найден нигде');
                return null;
            }
            
            const tooltipText = tooltip.textContent || '';
            console.log('[Faceit Score] Полный текст тултипа:', tooltipText);
            const startMatch = tooltipText.match(/Started at.*?(\d{2}):(\d{2})/);
            const finishMatch = tooltipText.match(/Finished at.*?(\d{2}):(\d{2})/);
            
            console.log('[Faceit Score] startMatch:', startMatch);
            console.log('[Faceit Score] finishMatch:', finishMatch);
            
            if (startMatch && finishMatch) {
                const duration = calculateDuration(startMatch, finishMatch);
                console.log('[Faceit Score] ✓ Вычисленная длительность:', duration);
                if (duration) {
                    // Нашли время - продолжаем наводиться для других матчей
                }
                return duration;
            } else {
                console.log('[Faceit Score] ✗ Regex не нашел совпадений в тексте');
            }
        } catch (e) {
            console.error('[Faceit Score] Ошибка в parseMatchDuration:', e);
        }
        
        return null;
    }
    
    function calculateDuration(startMatch, finishMatch) {
        const startHours = parseInt(startMatch[1]);
        const startMinutes = parseInt(startMatch[2]);
        const finishHours = parseInt(finishMatch[1]);
        const finishMinutes = parseInt(finishMatch[2]);
        
        let totalMinutes = (finishHours * 60 + finishMinutes) - (startHours * 60 + startMinutes);
        
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours > 0) {
            return `${hours}ч ${minutes}мин`;
        } else {
            return `${minutes}мин`;
        }
    }
    
    let tooltipCheckTimer = null;
    let tooltipObserver = null;
    let autoHoverTimer = null; // Таймер для автоматического наведения
    
    // MutationObserver для автоматического чтения тултипа
    function startTooltipObserver() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (tooltipObserver) return; // Уже запущен
        
        const tooltipPortal = document.getElementById('tooltip-portal');
        if (!tooltipPortal) {
            console.log('[Faceit Score] tooltip-portal не найден для наблюдения');
            return;
        }
        
        console.log('[Faceit Score] Запущен MutationObserver на tooltip-portal');
        
        tooltipObserver = new MutationObserver((mutations) => {
            if (!isScriptActive) return; // Не работаем если скрипт неактивен
            
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    // Что-то добавилось в tooltip-portal!
                    const tooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                    for (const tooltip of tooltips) {
                        const text = tooltip.textContent;
                        if (text.includes('Started at') && text.includes('Finished at')) {
                            console.log('[Faceit Score] ✓ MutationObserver обнаружил тултип!');
                            const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                            const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                            
                            if (startMatch && finishMatch) {
                                const duration = calculateDuration(startMatch, finishMatch);
                                console.log('[Faceit Score] ✓ Автоматически вычислено время:', duration);
                                if (duration) {
                                    // Обновляем popup
                                    setTimeout(() => {
                                        if (isPopupAlive() && isScriptActive) {
                                            const settings = getSettings();
                                            const { scoreElements } = findScores();
                                            if (scoreElements && scoreElements.scoreTeam1Element && scoreElements.scoreTeam2Element) {
                                                const scoreTeam1 = scoreElements.scoreTeam1Element.textContent.trim();
                                                const scoreTeam2 = scoreElements.scoreTeam2Element.textContent.trim();
                                                updatePopupDisplay(scoreTeam1, scoreTeam2, settings.fontSize, duration);
                                                broadcastScoreUpdate(scoreTeam1, scoreTeam2, settings.fontSize, duration);
                                            }
                                        }
                                    }, 100);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        });
        
        tooltipObserver.observe(tooltipPortal, {
            childList: true,
            subtree: true
        });
    }
    
    function stopTooltipObserver() {
        if (tooltipObserver) {
            tooltipObserver.disconnect();
            tooltipObserver = null;
            console.log('[Faceit Score] MutationObserver остановлен');
        }
    }
    
    // Автоматическое наведение на элемент "Finished" - УБРАЛИ ТАЙМЕР!
    function startAutoHover() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        // Просто один раз вызываем - а внутри performAutoHover будут запущены постоянные наведения
        performAutoHover();
    }
    
    function stopAutoHover() {
        if (autoHoverTimer) {
            clearInterval(autoHoverTimer);
            autoHoverTimer = null;
        }
    }
    
    function performAutoHover() {
        // ВЫЗЫВАЕМ СЕБЯ ПОСТОЯННО с небольшими интервалами!
        if (autoHoverTimer) return; // Уже запущен
        
        const doHover = () => {
            if (!isScriptActive) {
                stopAutoHover();
                return; // Не работаем если скрипт неактивен
            }
            
            try {
                // Ищем только элементы с тултипами
                const allHolders = document.querySelectorAll('[class*="Tooltip__Holder-sc-1f7e13b3-0"]');
            
            for (const holder of allHolders) {
                // Ищем trigger внутри holder
                let trigger = holder.querySelector('.Tooltip__TriggerContainer-sc-1f7e13b3-2');
                
                // Если не нашли trigger - ищем текст "Finished" в детях holder
                if (!trigger) {
                    const children = holder.querySelectorAll('div, span');
                    for (const child of children) {
                        if ((child.textContent || '').trim().toLowerCase() === 'finished') {
                            trigger = child;
                            break;
                        }
                    }
                }
                
                // Если все еще не нашли - используем сам holder
                trigger = trigger || holder;
                const text = trigger.textContent || trigger.innerText || '';
                
                if (text.trim().toLowerCase() === 'finished') {
                    
                    // МНОЖЕСТВЕННОЕ наведение с разными координатами
                    const events = [
                        // События БЕЗ координат (для скрытых элементов)
                        new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
                        new MouseEvent('mouseenter', { bubbles: true, cancelable: true }),
                        new MouseEvent('mousemove', { bubbles: true, cancelable: true }),
                        new PointerEvent('pointerover', { bubbles: true, cancelable: true }),
                        new PointerEvent('pointerenter', { bubbles: true, cancelable: true }),
                        new PointerEvent('pointermove', { bubbles: true, cancelable: true }),
                        // С событиями с координатами
                        new MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 500, clientY: 300 }),
                        new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 500, clientY: 300 }),
                    ];
                    
                    // Отправляем все события на trigger элемент
                    for (const event of events) {
                        trigger.dispatchEvent(event);
                    }
                    
                    console.log('[Faceit Score] 🤖 Отправлено', events.length, 'событий на:', trigger.tagName);
                    
                        // КРИТИЧНО: Делаем break после ПЕРВОГО элемента "Finished"!
                    break; // Останавливаемся на первом элементе, чтобы не создавать дубликаты
                }
            }
            } catch (e) {
                console.error('[Faceit Score] Ошибка автоматического наведения:', e);
            }
        };
        
        // Вызываем сразу
        doHover();
        
        // И вызываем каждые 100мс навсегда!
        autoHoverTimer = setInterval(doHover, 100);
    }
    
    function tryToRevealTooltip() {
        console.log('[Faceit Score] tryToRevealTooltip() вызвана');
        
        try {
            // Сначала ищем в #tooltip-portal (где находятся активные тултипы)
            const tooltipPortal = document.getElementById('tooltip-portal');
            if (tooltipPortal) {
                const portalTooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                console.log('[Faceit Score] tryToReveal: найдено тултипов в портале:', portalTooltips.length);
                for (const tooltip of portalTooltips) {
                    const text = tooltip.textContent;
                    if (text.includes('Started at') && text.includes('Finished at')) {
                        const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                        const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                        
                        if (startMatch && finishMatch) {
                            const duration = calculateDuration(startMatch, finishMatch);
                            if (duration) {
                                return;
                            }
                        }
                    }
                }
            }
            
            // Ищем уже существующие тултипы на странице
            const existingTooltips = document.querySelectorAll(
                '[role="tooltip"], ' +
                '.TooltipContent__BaseContainer-sc-692903b7-0, ' +
                '[class*="TooltipHolder"], ' +
                '[class*="TooltipContent__BaseContainer"], ' +
                '[class*="TooltipContent__TextsContainer"], ' +
                '[class*="TooltipContent__PrimaryLabel"]'
            );
                    for (const tooltip of existingTooltips) {
                        const text = tooltip.textContent;
                        if (text.includes('Started at') && text.includes('Finished at')) {
                            const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                            const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                            
                            if (startMatch && finishMatch) {
                                const duration = calculateDuration(startMatch, finishMatch);
                                if (duration) {
                                    stopAutoHover();
                                    return;
                                }
                            }
                        }
                    }
            
            // Если не нашли - пытаемся вызвать тултип наведением
            const holders = document.querySelectorAll('.Tooltip__Holder-sc-1f7e13b3-0');
            console.log('[Faceit Score] Найдено Tooltip__Holder элементов:', holders.length);
            for (const holder of holders) {
                const trigger = holder.querySelector('.Tooltip__TriggerContainer-sc-1f7e13b3-2');
                if (trigger) {
                    console.log('[Faceit Score] Trigger текст:', trigger.textContent.trim());
                }
                if (trigger && trigger.textContent.trim().toLowerCase() === 'finished') {
                    console.log('[Faceit Score] ✓ Нашли элемент "Finished", симулируем наведение');
                    
                    // Получаем координаты элемента
                    const rect = trigger.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    // Симулируем НАСТОЯЩЕЕ наведение мыши с координатами
                    const mouseEvents = [
                        new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
                        new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
                        new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
                        new PointerEvent('pointerover', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }),
                        new PointerEvent('pointerenter', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y })
                    ];
                    
                    mouseEvents.forEach(event => {
                        trigger.dispatchEvent(event);
                        holder.dispatchEvent(event);
                    });
                    
                    // Также пробуем focus
                    try {
                        trigger.focus();
                    } catch (e) {}
                    
                    // Несколько проверок с увеличивающейся задержкой
                    const checkForTooltip = (delay) => {
                        setTimeout(() => {
                            console.log(`[Faceit Score] Проверка тултипа через ${delay}ms`);
                            // Сначала проверяем #tooltip-portal
                            const tooltipPortal = document.getElementById('tooltip-portal');
                            if (tooltipPortal) {
                                const portalTooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                                for (const tooltip of portalTooltips) {
                                    const text = tooltip.textContent;
                                    if (text.includes('Started at') && text.includes('Finished at')) {
                                        const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                                        const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                                        
                                        if (startMatch && finishMatch) {
                                            const duration = calculateDuration(startMatch, finishMatch);
                                            console.log('[Faceit Score] ✓ Нашли время после симуляции (портал):', duration);
                                            if (duration) {
                                                stopAutoHover();
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Если не нашли в портале, ищем везде
                            console.log('[Faceit Score] Ищем везде после симуляции');
                            const tooltips = document.querySelectorAll(
                                '[role="tooltip"], ' +
                                '.TooltipContent__BaseContainer-sc-692903b7-0, ' +
                                '[class*="TooltipHolder"], ' +
                                '[class*="TooltipContent__BaseContainer"], ' +
                                '[class*="TooltipContent__TextsContainer"]'
                            );
                            for (const tooltip of tooltips) {
                                const text = tooltip.textContent;
                                if (text.includes('Started at') && text.includes('Finished at')) {
                                    const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                                    const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                                    
                                    if (startMatch && finishMatch) {
                                        const duration = calculateDuration(startMatch, finishMatch);
                                        if (duration) {
                                            return;
                                        }
                                    }
                                }
                            }
                        }, delay);
                    };
                    
                    // Проверяем сразу и через короткие интервалы
                    checkForTooltip(0);
                    checkForTooltip(50);
                    checkForTooltip(100);
                    
                    // Убираем наведение через 1.5 секунды
                    setTimeout(() => {
                        holder.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window }));
                        trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window }));
                    }, 1500);
                    
                    break;
                }
            }
        } catch (e) {}
    }

    // ============================================================================
    // UI - СОЗДАНИЕ КНОПКИ
    // ============================================================================

    function createButton() {
        const buttonElement = document.createElement('button');
        Object.assign(buttonElement.style, {
            position: 'fixed',
            top: CONFIG.BUTTON_TOP,
            right: CONFIG.BUTTON_RIGHT,
            zIndex: CONFIG.BUTTON_Z_INDEX,
            padding: CONFIG.BUTTON_PADDING,
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: CONFIG.BUTTON_BORDER_RADIUS,
            cursor: 'pointer',
            boxShadow: CONFIG.BUTTON_BOX_SHADOW,
            fontSize: CONFIG.BUTTON_FONT_SIZE,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: CONFIG.BUTTON_GAP
        });
        
        // Иконка глаза для скрытия (в начале)
        const eyeIcon = document.createElement('span');
        eyeIcon.innerHTML = '👁️';
        // Начинаем с зеленого цвета (скрипт по умолчанию неактивен)
        eyeIcon.style.cssText = `font-size: ${CONFIG.EYE_ICON_SIZE}; cursor: pointer; padding: ${CONFIG.EYE_ICON_PADDING}; background-color: ${CONFIG.EYE_ICON_BG_COLOR_INACTIVE}; border: ${CONFIG.EYE_ICON_BORDER}; border-radius: ${CONFIG.EYE_ICON_BORDER_RADIUS}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;`;
        eyeIcon.title = 'Скрыть кнопку';
        let originalBgColor = CONFIG.EYE_ICON_BG_COLOR_INACTIVE;
        eyeIcon.addEventListener('mouseenter', () => {
            eyeIcon.style.backgroundColor = CONFIG.EYE_ICON_BG_HOVER;
            eyeIcon.style.borderColor = CONFIG.EYE_ICON_BORDER_HOVER;
        });
        eyeIcon.addEventListener('mouseleave', () => {
            eyeIcon.style.backgroundColor = originalBgColor;
            const borderParts = CONFIG.EYE_ICON_BORDER.split(' ');
            eyeIcon.style.borderColor = borderParts.slice(2).join(' ');
        });
        // Сохраняем ссылку на оригинальный цвет для обновления
        eyeIcon._updateColor = function(active) {
            originalBgColor = active ? CONFIG.EYE_ICON_BG_COLOR_ACTIVE : CONFIG.EYE_ICON_BG_COLOR_INACTIVE;
            eyeIcon.style.backgroundColor = originalBgColor;
        };
        eyeIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            hideMainButton();
        });
        
        // Текст кнопки
        const buttonText = document.createElement('span');
        buttonText.textContent = 'Показать счет';
        buttonText.style.cssText = 'white-space: nowrap;';
        
        buttonElement.appendChild(eyeIcon);
        buttonElement.appendChild(buttonText);
        document.body.appendChild(buttonElement);
        return buttonElement;
    }

    // Сохранение видимости кнопки
    function saveButtonVisibility(visible) {
        try {
            localStorage.setItem(STORAGE_KEYS.BUTTON_VISIBLE, visible ? '1' : '0');
        } catch (e) {
            // Игнорируем ошибки
        }
    }

    // Загрузка видимости кнопки
    function loadButtonVisibility() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.BUTTON_VISIBLE);
            // По умолчанию кнопка видима
            return saved === null ? true : saved === '1';
        } catch (e) {
            return true; // По умолчанию видима
        }
    }

    // Создание маленькой иконки глаза (когда кнопка скрыта)
    function createHideButton() {
        const hideBtn = document.createElement('div');
        hideBtn.innerHTML = '👁️';
        // Используем цвет в зависимости от состояния скрипта
        const bgColor = isScriptActive ? CONFIG.HIDE_BUTTON_BG_ACTIVE : CONFIG.HIDE_BUTTON_BG_INACTIVE;
        Object.assign(hideBtn.style, {
            position: 'fixed',
            top: CONFIG.BUTTON_TOP,
            right: CONFIG.BUTTON_RIGHT,
            zIndex: CONFIG.BUTTON_Z_INDEX,
            width: CONFIG.HIDE_BUTTON_SIZE,
            height: CONFIG.HIDE_BUTTON_SIZE,
            backgroundColor: bgColor,
            color: '#fff',
            border: CONFIG.HIDE_BUTTON_BORDER,
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: CONFIG.BUTTON_BOX_SHADOW,
            fontSize: CONFIG.HIDE_BUTTON_FONT_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: CONFIG.HIDE_BUTTON_OPACITY,
            transition: 'opacity 0.2s'
        });
        hideBtn.title = 'Показать кнопку счета';
        hideBtn.addEventListener('mouseenter', () => {
            hideBtn.style.opacity = CONFIG.HIDE_BUTTON_OPACITY_HOVER;
        });
        hideBtn.addEventListener('mouseleave', () => {
            hideBtn.style.opacity = CONFIG.HIDE_BUTTON_OPACITY;
        });
        hideBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMainButton();
        });
        document.body.appendChild(hideBtn);
        return hideBtn;
    }

    // Скрытие главной кнопки
    function hideMainButton() {
        if (button) {
            button.style.display = 'none';
            saveButtonVisibility(false);
            
            // Создаем маленькую иконку глаза
            if (!hideButton) {
                hideButton = createHideButton();
            } else {
                hideButton.style.display = 'flex';
            }
        }
    }

    // Показать главную кнопку
    function showMainButton() {
        if (button) {
            button.style.display = 'flex';
            saveButtonVisibility(true);
            
            // Скрываем маленькую иконку
            if (hideButton) {
                hideButton.style.display = 'none';
            }
        }
    }

    // Обновление текста и цвета кнопки
    function updateButtonText(text, backgroundColor, buttonElement) {
        const btn = buttonElement || button;
        if (!btn) return;
        
        const buttonText = btn.querySelector('span:last-child');
        const eyeIcon = btn.querySelector('span:first-child');
        
        if (buttonText) {
            buttonText.textContent = text;
        }
        if (backgroundColor) {
            btn.style.backgroundColor = backgroundColor;
            // Обновляем цвет иконки глаза в зависимости от цвета кнопки
            if (eyeIcon && eyeIcon._updateColor) {
                const isActive = backgroundColor === '#f44336'; // Красный = активен
                eyeIcon._updateColor(isActive);
            }
        }
        
        // Обновляем цвет скрытой иконки, если она есть
        if (hideButton) {
            const isActive = backgroundColor === '#f44336'; // Красный = активен
            updateHideButtonColor(isActive);
        }
    }
    
    // Обновление цвета скрытой иконки
    function updateHideButtonColor(active) {
        if (!hideButton) return;
        hideButton.style.backgroundColor = active ? CONFIG.HIDE_BUTTON_BG_ACTIVE : CONFIG.HIDE_BUTTON_BG_INACTIVE;
    }

    // ============================================================================
    // ПОИСК ЭЛЕМЕНТОВ НА СТРАНИЦЕ
    // ============================================================================
    
    function findMatchSearch() {
        // Поиск элементов поиска матча
        try {
            // Сначала пробуем через специальные селекторы
            for (const selector of SELECTORS.MATCH_SEARCH_TEXT) {
                let textElement = null;
                
                // Ищем только элементы ButtonTextWrapper (кнопки поиска матча)
                const buttonElements = document.querySelectorAll('[class*="ButtonTextWrapper"]');
                for (const el of buttonElements) {
                    const text = el.textContent || '';
                    const trimmedText = text.trim();
                    // Проверяем все возможные статусы поиска матча
                    for (const status of SELECTORS.MATCH_SEARCH_STATUSES) {
                        if (trimmedText.includes(status)) {
                            textElement = el;
                            break;
                        }
                    }
                    if (textElement) break;
                }
                
                if (textElement && textElement.textContent) {
                    const text = textElement.textContent.trim();
                    // Проверяем все возможные статусы поиска матча
                    if (SELECTORS.MATCH_SEARCH_STATUSES.some(status => text.includes(status))) {
                        // Нашли текст "Finding match", теперь ищем таймер используя селекторы из CONFIG
                        for (const timerSelector of SELECTORS.MATCH_SEARCH_TIMER) {
                            const timerElement = document.querySelector(timerSelector);
                            if (timerElement && timerElement.textContent) {
                                const timer = timerElement.textContent.trim();
                                // Проверяем, что это формат времени (например, "00:35")
                                if (/^\d{2}:\d{2}$/.test(timer)) {
                                    return { isSearching: true, timer };
                                }
                            }
                        }
                        
                        // Если не нашли через селекторы, ищем таймер рядом с элементом
                        const parent = textElement.parentElement;
                        if (parent) {
                            // Ищем CountDownWrapper в родителе
                            const timerElements = parent.querySelectorAll('[class*="CountDownWrapper"]');
                            for (const timerEl of timerElements) {
                                const timerText = timerEl.textContent || '';
                                if (/^\d{2}:\d{2}$/.test(timerText.trim())) {
                                    const timer = timerText.trim();
                                    return { isSearching: true, timer };
                                }
                            }
                        }
                        
                        return { isSearching: true, timer: null };
                    }
                }
            }
        } catch {}
        
        return { isSearching: false, timer: null };
    }
    
    function findScores() {
        const currentUrl = window.location.href;
        const isMatchPage = CONFIG.MATCH_URL_PATTERNS.some(pattern => currentUrl.includes(pattern));
        
        if (!isMatchPage) {
            lastScore = null;
            lastMatchPageTime = 0;
            lastMatchPageUrl = '';
            stopAutoHover(); // Останавливаем автоматическое наведение
            
            try {
                localStorage.removeItem(STORAGE_KEYS.INACTIVE_TAB_DATA);
            } catch {}
            
            if (isScriptActive && isPopupAlive()) {
                try {
                    const settings = getSettings();
                    updatePopupDisplay('Ожидание...', '', settings.fontSize, '');
                } catch {}
            }
            
            return { 
                scoreElements: { scoreTeam1Element: null, scoreTeam2Element: null },
                timeElement: null
            };
        }

        const now = Date.now();
        if (currentUrl !== lastMatchPageUrl) {
            lastMatchPageTime = now;
            lastMatchPageUrl = currentUrl;
            lastScore = null; // Сбрасываем счет - КРИТИЧНО!
            lastSoundScore = null; // Сбрасываем звуковой счет
            
            // КРИТИЧНО: Полностью очищаем ВСЕ таймеры при переходе на новый матч!
            clearInterval(tooltipCheckTimer);
            tooltipCheckTimer = null;
            stopTooltipObserver();
            stopAutoHover();
        }
        
        if (now - lastMatchPageTime < CONFIG.MATCH_PAGE_LOAD_DELAY) {
            return { 
                scoreElements: { scoreTeam1Element: null, scoreTeam2Element: null },
                timeElement: null
            };
        }
        
        let scoreElements = null;
        let timeElement = null;

        // Поиск элементов счета
        for (const selector of SELECTORS.SCORE_ELEMENTS) {
            const scoreNodes = document.querySelectorAll(selector);
            if (scoreNodes.length >= 2) {
                scoreElements = { 
                scoreTeam1Element: scoreNodes[0], 
                scoreTeam2Element: scoreNodes[1] 
            };
                break;
            }
        }

        if (!scoreElements) {
            for (const containerSelector of SELECTORS.SCORE_CONTAINERS) {
                const container = document.querySelector(containerSelector);
        if (container) {
                    for (const selector of SELECTORS.SCORE_ELEMENTS) {
                        const scoreNodes = container.querySelectorAll(selector);
            if (scoreNodes.length >= 2) {
                            scoreElements = { 
                    scoreTeam1Element: scoreNodes[0], 
                    scoreTeam2Element: scoreNodes[1] 
                };
                            break;
                        }
                    }
                    if (scoreElements) break;
                }
            }
        }

        if (!scoreElements) {
            const fallbackNodes = Array.from(document.querySelectorAll('h3, div, span'))
            .filter(el => {
                const text = el.textContent?.trim() || '';
                    const hasNumber = /\b\d+\b/.test(text);
                    const hasRelevantClass = SELECTORS.FALLBACK_CLASS_PATTERNS.some(pattern => 
                        el.className.includes(pattern)
                    );
                    return hasNumber && hasRelevantClass;
                });

            if (fallbackNodes.length >= 2) {
                scoreElements = { 
                    scoreTeam1Element: fallbackNodes[0], 
                    scoreTeam2Element: fallbackNodes[1] 
                };
            }
        }

        // Поиск времени матча - СНАЧАЛА ищем в контейнере матча (это приоритет!)
        const factionsContainer = document.querySelector('[class*="FactionsDetails__Details"]');
        if (factionsContainer && !timeElement) {
            const timeInContainer = factionsContainer.querySelector('.Tooltip__TriggerContainer');
            const text = timeInContainer?.textContent?.trim() || '';
            const hasTimeFormat = /:\d{2}/.test(text);
            if (timeInContainer && text && hasTimeFormat && !text.toLowerCase().includes('best of')) {
                timeElement = timeInContainer;
            }
        }
        
        // Если не нашли в контейнере - пробуем другие селекторы
        if (!timeElement) {
        for (const selector of SELECTORS.TIME_ELEMENTS) {
            const timeNode = document.querySelector(selector);
                const text = timeNode?.textContent?.trim() || '';
                // Проверяем, что это формат времени (должно содержать двоеточие для времени)
                const hasTimeFormat = /:\d{2}/.test(text);
                // Игнорируем текст "Best of 1", "Best of 3" и т.д.
                if (timeNode && text && hasTimeFormat && !text.toLowerCase().includes('best of')) {
                    timeElement = timeNode;
                    break;
                }
            }
        }

        if (!timeElement) {
            const textSelectors = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            for (const selector of textSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent?.trim() || '';
                    const timePattern = /^\d{2}:\d{2}:\d{2}$|^\d{1,2}:\d{2}$/;
                    // Игнорируем текст "Best of 1", "Best of 3" и т.д.
                    if (timePattern.test(text) && el.children.length === 0 && !text.toLowerCase().includes('best of')) {
                        timeElement = el;
                        break;
                    }
                }
                if (timeElement) break;
            }
        }

        return {
            scoreElements: scoreElements || { scoreTeam1Element: null, scoreTeam2Element: null },
            timeElement
        };
    }

    // ============================================================================
    // СИСТЕМА ПРИОРИТЕТОВ ВКЛАДОК
    // ============================================================================

    function shouldIgnoreCurrentTab() {
        if (!CONFIG.TAB_PRIORITY_ENABLED) return false;
        
        const currentTab = getCurrentTabUrl();
        const activeTab = getActiveTabFromStorage();
        
        // Если нет активной вкладки - не игнорируем
        if (!activeTab) return false;
        
        // Если это текущая вкладка - не игнорируем
        if (currentTab === activeTab) return false;
        
        // Проверяем, есть ли активная вкладка еще актуальна
        const activeTabTimestamp = getActiveTabTimestamp();
        const now = Date.now();
        
        // Если активная вкладка не обновлялась более 5 секунд - освобождаем приоритет
        if (activeTabTimestamp && (now - activeTabTimestamp > 5000)) {
            setActiveTabInStorage(null);
            return false;
        }
        
        // Если есть другая активная вкладка - игнорируем текущую
        return true;
    }
    
    function getActiveTabFromStorage() {
        try {
            return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_URL);
        } catch {
            return null;
        }
    }
    
    function setActiveTabInStorage(tabUrl) {
        try {
            if (tabUrl) {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_URL, tabUrl);
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_URL + '_timestamp', String(Date.now()));
            } else {
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL + '_timestamp');
            }
        } catch {}
    }
    
    function getActiveTabTimestamp() {
        try {
            const timestamp = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_URL + '_timestamp');
            return timestamp ? parseInt(timestamp) : null;
        } catch {
            return null;
        }
    }
    
    function updateActiveTabTimestamp() {
        try {
        const activeTab = getActiveTabFromStorage();
            const currentTab = getCurrentTabUrl();
            if (activeTab === currentTab) {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_URL + '_timestamp', String(Date.now()));
            }
        } catch {}
    }

    // ============================================================================
    // СИСТЕМА ОТСЛЕЖИВАНИЯ НЕАКТИВНЫХ ВКЛАДОК
    // ============================================================================
    
    function saveInactiveTabData(scoreData) {
        if (!CONFIG.INACTIVE_TAB_ENABLED) return;
        
        try {
            const data = {
                url: getCurrentTabUrl(),
                timestamp: Date.now(),
                scoreTeam1: scoreData.scoreTeam1,
                scoreTeam2: scoreData.scoreTeam2,
                matchTime: scoreData.matchTime,
                score: `${scoreData.scoreTeam1}-${scoreData.scoreTeam2}`
            };
            
            localStorage.setItem(STORAGE_KEYS.INACTIVE_TAB_DATA, JSON.stringify(data));
        } catch {}
    }
    
    function getInactiveTabData() {
        if (!CONFIG.INACTIVE_TAB_ENABLED) return null;
        
        try {
            const data = localStorage.getItem(STORAGE_KEYS.INACTIVE_TAB_DATA);
            if (data) {
                const parsed = JSON.parse(data);
                // Возвращаем данные ВСЕГДА, без проверки времени жизни
                    return parsed;
            }
        } catch {}
        return null;
    }
    
    function startInactiveTabMonitoring() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (!CONFIG.INACTIVE_TAB_ENABLED) return;
        
        clearInterval(inactiveTabTimer);
        inactiveTabTimer = setInterval(() => {
            if (!isTabVisible() && isScriptActive) {
                const inactiveData = getInactiveTabData();
                if (inactiveData && inactiveData.url !== getCurrentTabUrl()) {
                    if (isPopupAlive()) {
                        updatePopupDisplay(inactiveData.scoreTeam1, inactiveData.scoreTeam2, 
                            getSettings().fontSize, inactiveData.matchTime);
                    }
                    broadcastScoreUpdate(inactiveData.scoreTeam1, inactiveData.scoreTeam2, 
                        getSettings().fontSize, inactiveData.matchTime);
                }
            }
        }, CONFIG.INACTIVE_TAB_CHECK_INTERVAL);
    }
    
    function stopInactiveTabMonitoring() {
        clearInterval(inactiveTabTimer);
        clearInterval(backgroundSyncTimer);
        inactiveTabTimer = null;
        backgroundSyncTimer = null;
    }
    
    // ============================================================================
    // АГРЕССИВНЫЙ МОНИТОРИНГ НЕАКТИВНЫХ ВКЛАДОК
    // ============================================================================
    
    function startAggressiveMonitoring() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (!CONFIG.AGGRESSIVE_MONITORING) return;
        
        backgroundSyncTimer = setInterval(() => {
            if (isScriptActive && !isTabVisible()) {
                try {
                    const temp = document.createElement('div');
                    temp.style.display = 'none';
                    document.body.appendChild(temp);
                    document.body.removeChild(temp);
                    
                    const { scoreElements, timeElement } = findScores();
                    if (scoreElements && scoreElements.scoreTeam1Element && scoreElements.scoreTeam2Element) {
                        const scoreTeam1 = scoreElements.scoreTeam1Element.textContent.trim() || '0';
                        const scoreTeam2 = scoreElements.scoreTeam2Element.textContent.trim() || '0';
                        const matchTime = timeElement ? timeElement.textContent.trim() : '';
                        
                        saveInactiveTabData({ scoreTeam1, scoreTeam2, matchTime });
                    }
                } catch {}
            }
        }, CONFIG.BACKGROUND_SYNC_INTERVAL);
    }
    
    function forceTabWakeUp() {
        if (!CONFIG.AGGRESSIVE_MONITORING) return;
        
        try {
            const originalTitle = document.title;
            document.title = originalTitle + ' ';
            setTimeout(() => document.title = originalTitle, CONFIG.TITLE_FLASH_DELAY);
            
            window.dispatchEvent(new Event('resize'));
            
            const body = document.body;
            if (body) {
                body.style.transform = 'translateZ(0)';
                setTimeout(() => body.style.transform = '', CONFIG.DOM_TRANSFORM_DELAY);
            }
        } catch {}
    }
    
    // ============================================================================
    // WEB WORKER ДЛЯ ФОНОВОЙ РАБОТЫ
    // ============================================================================

    function startWebWorker() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (!CONFIG.WEB_WORKER_ENABLED || webWorker) return;
        
        try {
            const workerCode = `
                setInterval(() => {
                    postMessage({ type: 'ping', timestamp: Date.now() });
                }, ${CONFIG.WEB_WORKER_INTERVAL});
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            webWorkerUrl = URL.createObjectURL(blob);
            
            webWorker = new Worker(webWorkerUrl);
            webWorker.onmessage = (event) => {
                if (event.data.type === 'ping' && !isTabVisible()) {
                    forceTabWakeUp();
                    const { scoreElements, timeElement } = findScores();
                    if (scoreElements && scoreElements.scoreTeam1Element && scoreElements.scoreTeam2Element) {
                        const scoreTeam1 = scoreElements.scoreTeam1Element.textContent.trim() || '0';
                        const scoreTeam2 = scoreElements.scoreTeam2Element.textContent.trim() || '0';
                        const matchTime = timeElement ? timeElement.textContent.trim() : '';
                        saveInactiveTabData({ scoreTeam1, scoreTeam2, matchTime });
                    }
                }
            };
            
            webWorker.onerror = () => {
                webWorker = null;
            };
        } catch {}
    }
    
    function stopWebWorker() {
        if (webWorker) {
            webWorker.terminate();
            webWorker = null;
        }
        if (webWorkerUrl) {
            URL.revokeObjectURL(webWorkerUrl);
            webWorkerUrl = null;
        }
    }
    
    // ============================================================================
    // INTERSECTION OBSERVER
    // ============================================================================

    function startIntersectionObserver() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (!CONFIG.INTERSECTION_OBSERVER_ENABLED || intersectionObserver) return;
        
        try {
            const observerElement = document.createElement('div');
            observerElement.style.position = 'fixed';
            observerElement.style.top = '-1px';
            observerElement.style.left = '-1px';
            observerElement.style.width = '1px';
            observerElement.style.height = '1px';
            observerElement.style.opacity = '0';
            observerElement.style.pointerEvents = 'none';
            document.body.appendChild(observerElement);
            
            intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isTabVisible()) {
                        forceTabWakeUp();
                    }
                });
            }, { threshold: 0.1 });
            
            intersectionObserver.observe(observerElement);
        } catch {}
    }
    
    function stopIntersectionObserver() {
        if (intersectionObserver) {
            intersectionObserver.disconnect();
            intersectionObserver = null;
        }
    }
    
    // ============================================================================
    // DOM СОБЫТИЯ ДЛЯ ПРОБУЖДЕНИЯ ВКЛАДОК
    // ============================================================================

    function startDomEvents() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        if (!CONFIG.DOM_EVENTS_ENABLED || domEventsTimer) return;
        
        domEventsTimer = setInterval(() => {
            if (!isScriptActive) return; // Не работаем если скрипт неактивен
            if (!isTabVisible()) {
                try {
                    const events = ['mousemove', 'scroll', 'resize', 'focus', 'blur', 'click', 'keydown', 'keyup'];
                    events.forEach(eventType => {
                        window.dispatchEvent(new Event(eventType));
                        document.dispatchEvent(new Event(eventType));
                    });
                    
                    window.dispatchEvent(new Event('visibilitychange'));
                    document.dispatchEvent(new Event('visibilitychange'));
                } catch {}
            }
        }, CONFIG.BACKGROUND_SYNC_DELAY);
    }
    
    function stopDomEvents() {
        if (domEventsTimer) {
            clearInterval(domEventsTimer);
            domEventsTimer = null;
        }
    }
    
    function startAllAdvancedTricks() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        startWebWorker();
        startIntersectionObserver();
        startDomEvents();
    }
    
    function stopAllAdvancedTricks() {
        stopWebWorker();
        stopIntersectionObserver();
        stopDomEvents();
    }
    
    // ============================================================================
    // ОБРАБОТКА СЧЕТА И ОБНОВЛЕНИЕ POPUP
    // ============================================================================

    function sendScoreToPopup(fontSize, playSound) {
        const { scoreElements, timeElement } = findScores();
        
        // Проверяем, есть ли счет на текущей вкладке
        const hasScore = scoreElements && scoreElements.scoreTeam1Element && scoreElements.scoreTeam2Element;
        
        if (!hasScore) {
            // Проверяем, идет ли поиск матча
            const matchSearch = findMatchSearch();
            if (matchSearch && matchSearch.isSearching) {
                // Идет поиск матча - показываем "Поиск" и таймер (если есть)
                const timer = matchSearch.timer || '';
                updatePopupDisplay('Поиск', '', fontSize, timer);
                broadcastScoreUpdate('Поиск', '', fontSize, timer);
                return;
            }
            
            // Если на текущей вкладке нет счета - освобождаем приоритет и останавливаем таймеры
            const currentTab = getCurrentTabUrl();
            const activeTab = getActiveTabFromStorage();
            if (currentTab === activeTab) {
                setActiveTabInStorage(null);
            }
            
            // КРИТИЧНО: Останавливаем все таймеры при переходе на страницу без матча!
            clearInterval(tooltipCheckTimer);
            tooltipCheckTimer = null;
            stopTooltipObserver();
            stopAutoHover();
            
            lastScore = null;
            updatePopupDisplay('Ожидание...', '', fontSize, '');
            broadcastScoreUpdate('Ожидание...', '', fontSize, '');
            return;
        }
        
        // Если на вкладке есть счет - пытаемся стать активной
        const currentTab = getCurrentTabUrl();
        const activeTab = getActiveTabFromStorage();
        
        if (!activeTab) {
            // Нет активной вкладки - становимся активной
            setActiveTabInStorage(currentTab);
        } else if (activeTab === currentTab) {
            // Мы активная вкладка - обновляем timestamp
            updateActiveTabTimestamp();
        } else {
            // Есть другая активная вкладка - проверяем не устарела ли она
            if (shouldIgnoreCurrentTab()) {
                return; // Игнорируем эту вкладку
            }
            // Если shouldIgnoreCurrentTab вернул false, значит старая вкладка освободила приоритет
            setActiveTabInStorage(currentTab);
        }

        const scoreTeam1 = scoreElements.scoreTeam1Element.textContent.trim() || '0';
        const scoreTeam2 = scoreElements.scoreTeam2Element.textContent.trim() || '0';
        const currentScore = `${scoreTeam1}-${scoreTeam2}`;
        let matchTime = timeElement ? timeElement.textContent.trim() : '';

        // Если матч завершен, вычисляем продолжительность
        const isFinished = matchTime && (
            matchTime.toLowerCase() === 'finished' || 
            matchTime.toLowerCase().includes('finished')
        );
        
        // Запускаем наведение если видим "Finished" (но только ОДИН РАЗ!)
        if (isFinished && !autoHoverTimer) {
            performAutoHover(); // Запускаем только если еще не запущен!
        }
        if (isFinished) {
            // Сразу проверяем portal - может тултип уже есть!
            const tooltipPortal = document.getElementById('tooltip-portal');
            if (tooltipPortal) {
                const portalTooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                for (const tooltip of portalTooltips) {
                    const text = tooltip.textContent || '';
                    if (text.includes('Started at') && text.includes('Finished at')) {
                        const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                        const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                        if (startMatch && finishMatch) {
                            const duration = calculateDuration(startMatch, finishMatch);
                            if (duration) {
                                matchTime = duration;
                                break; // Нашли сразу!
                            }
                        }
                    }
                }
            }
            
                // Пытаемся парсить через parseMatchDuration
                let duration = parseMatchDuration(timeElement);
                if (duration) {
                    matchTime = duration;
                } else {
                    // Запускаем агрессивный поиск
                    tryToRevealTooltip();
                
                    // Ждем немного и проверяем снова
                    setTimeout(() => {
                        const durationRetry = parseMatchDuration(timeElement);
                        if (durationRetry) {
                            // Обновляем popup с новым временем
                            const settings = getSettings();
                            if (isPopupAlive()) {
                                updatePopupDisplay(scoreTeam1, scoreTeam2, settings.fontSize, durationRetry);
                            }
                            broadcastScoreUpdate(scoreTeam1, scoreTeam2, settings.fontSize, durationRetry);
                        }
                    }, 0);
                }
                
                // Запускаем MutationObserver для автоматического чтения
                startTooltipObserver();
                
                // Запускаем СУПЕР АГРЕССИВНЫЙ мониторинг tooltip-portal (каждые 100м-distance!)
                if (!tooltipCheckTimer) {
                    let attempts = 0;
                    console.log('[Faceit Score] 🚀 ЗАПУСК СУПЕР АГРЕССИВНОГО мониторинга (каждые 100мс!)');
                    console.log('[Faceit Score] MutationObserver + AutoHover + Direct Portal Scan!');
                    
                    tooltipCheckTimer = setInterval(() => {
                        if (!isScriptActive) return; // Не работаем если скрипт неактивен
                        
                        attempts++;
                        
                        // КРИТИЧНО: Получаем СВЕЖИЙ счет И время каждый раз!
                        const { scoreElements: freshScoreElements, timeElement: freshTimeElement } = findScores();
                        const freshScoreTeam1 = freshScoreElements?.scoreTeam1Element?.textContent.trim() || '0';
                        const freshScoreTeam2 = freshScoreElements?.scoreTeam2Element?.textContent.trim() || '0';
                        const freshMatchTime = freshTimeElement ? freshTimeElement.textContent.trim() : '';
                        
                        // НАПРЯМУЮ сканируем tooltip-portal каждый раз!
                        const tooltipPortal = document.getElementById('tooltip-portal');
                        if (tooltipPortal) {
                            const portalTooltips = tooltipPortal.querySelectorAll('[role="tooltip"], [class*="TooltipHolder"], [class*="TooltipContent"]');
                            for (const tooltip of portalTooltips) {
                                const text = tooltip.textContent || '';
                                if (text.includes('Started at') && text.includes('Finished at')) {
                                    console.log('[Faceit Score] 🔥 НАШЛИ В ПОРТАЛЕ!', text);
                                    const startMatch = text.match(/Started at.*?(\d{2}):(\d{2})/);
                                    const finishMatch = text.match(/Finished at.*?(\d{2}):(\d{2})/);
                                    
                                    if (startMatch && finishMatch) {
                                        const duration = calculateDuration(startMatch, finishMatch);
                                        console.log('[Faceit Score] ✓✓✓ ВЫЧИСЛИЛИ:', duration);
                                        if (duration) {
                                            // Обновляем popup СО СВЕЖИМИ значениями!
                                            const settings = getSettings();
                                            if (isPopupAlive()) {
                                                updatePopupDisplay(freshScoreTeam1, freshScoreTeam2, settings.fontSize, duration);
                                            }
                                            broadcastScoreUpdate(freshScoreTeam1, freshScoreTeam2, settings.fontSize, duration);
                                            return; // Выходим из цикла tooltips, но продолжаем мониторинг
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Продолжаем мониторинг навсегда!
                        if (attempts > 600) { // 60 секунд (600 * 100мс)
                            console.log('[Faceit Score] ⚠ 60 секунд прошло, продолжаем мониторинг...');
                            attempts = 0; // Сбрасываем счетчик, но продолжаем работать
                        }
                    }, 100); // КАЖДЫЕ 100 МС!
                }
                
                // НЕ устанавливаем "Матч завершен" если уже есть вычисленная длительность!
                if (!matchTime || matchTime === '' || matchTime === 'Finished') {
                    matchTime = 'Матч завершен';
                }
        }

        const scoreChanged = currentScore !== lastScore;
        
        if (playSound && scoreChanged && currentScore !== lastSoundScore) {
            lastSoundScore = currentScore;
            
            if (scoreChannel) {
                try {
                    scoreChannel.postMessage({ type: 'playSound', score: currentScore });
                } catch {}
            }
        }

        // ВСЕГДА обновляем lastScore
        lastScore = currentScore;

        saveInactiveTabData({ scoreTeam1, scoreTeam2, matchTime });
        forceTabWakeUp();

        // ВСЕГДА обновляем popup - не зависим от scoreChanged
        if (isPopupAlive()) {
            updatePopupDisplay(scoreTeam1, scoreTeam2, fontSize, matchTime);
        }

        broadcastScoreUpdate(scoreTeam1, scoreTeam2, fontSize, matchTime);
    }

    function updatePopupDisplay(scoreTeam1, scoreTeam2, fontSize, matchTime = '') {
        try {
            const doc = scoreWindow.document;
            const scoreDisplay = doc.getElementById('scoreDisplay');
            const timeDisplay = doc.getElementById('timeDisplay');
            const fontSizeInput = doc.getElementById('fontSizeInput');
            
            if (scoreDisplay) {
                if (scoreTeam1 === 'Ожидание...') {
                    scoreDisplay.textContent = 'Ожидание...';
                } else if (scoreTeam1 === 'Поиск') {
                    scoreDisplay.textContent = 'Поиск';
                } else {
                scoreDisplay.textContent = `${scoreTeam1} - ${scoreTeam2}`;
                }
                scoreDisplay.style.fontSize = `${fontSize}px`;
            }
            
            if (timeDisplay) {
                if (matchTime && matchTime !== 'Ожидание...') {
                    timeDisplay.textContent = matchTime;
                    timeDisplay.style.display = 'block';
                } else if (matchTime === 'Ожидание...') {
                    timeDisplay.textContent = 'Ожидание...';
                    timeDisplay.style.display = 'block';
                } else {
                    timeDisplay.style.display = 'none';
                }
            }
            
            if (fontSizeInput) {
                fontSizeInput.value = String(fontSize);
            }
        } catch {}
    }

    function broadcastScoreUpdate(scoreTeam1, scoreTeam2, fontSize, matchTime = '') {
        try {
            scoreChannel?.postMessage({ type: 'update', scoreTeam1, scoreTeam2, fontSize, matchTime });
        } catch {}
    }

    // ============================================================================
    // ГЕНЕРАЦИЯ HTML ДЛЯ POPUP
    // ============================================================================

    function writePopupHTML(targetWindow) {
        try {
            const doc = targetWindow.document;
            doc.open();
            doc.write(generatePopupHTML());
            doc.close();
            return true;
        } catch {
            return false;
        }
    }

    function generatePopupHTML() {
        return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Счет матча</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            background-color: #f0f0f0; 
            margin: 0; 
            padding: ${CONFIG.POPUP_PADDING}; 
            overflow: hidden; 
            user-select: none; 
            -webkit-user-select: none; 
            -moz-user-select: none; 
            -ms-user-select: none; 
        }
        .score { 
            font-size: ${CONFIG.SCORE_FONT_SIZE}; 
            font-weight: bold; 
            margin: 0; 
            line-height: 1.1; 
        }
        .time { 
            font-size: ${CONFIG.TIME_FONT_SIZE};
            font-weight: bold; 
            margin: ${CONFIG.TIME_MARGIN};
            color: #666; 
            display: none; 
        }
        .row { 
            margin: ${CONFIG.ROW_MARGIN}; 
            font-size: ${CONFIG.ROW_FONT_SIZE}; 
        }
        input[type=number] { 
            text-align: center; 
            user-select: text; 
            -webkit-user-select: text; 
            -moz-user-select: text; 
            -ms-user-select: text; 
        }
        .control-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${CONFIG.POPUP_GAP}px;
        }
    </style>
</head>
<body>
    <div class="score" id="scoreDisplay">Ожидание...</div>
    <div class="time" id="timeDisplay"></div>
    <div class="row">
        <label for="fontSizeInput">Размер шрифта (px)</label>
        <input type="number" id="fontSizeInput" value="60" style="width:${CONFIG.INPUT_WIDTH};margin-left:${CONFIG.INPUT_MARGIN};">
    </div>
    <label class="row control-group">
        <input type="checkbox" id="soundCheckbox"> Звуковое оповещение
    </label>
    <div class="row control-group">
        <label class="control-group">
            <input type="checkbox" id="autoReloadCheckbox"> Авто-перезагрузка
        </label>
        <input type="number" id="autoReloadSec" min="5" step="1" placeholder="сек" style="width:${CONFIG.AUTO_RELOAD_WIDTH};">
    </div>
    ${generatePopupScript()}
</body>
</html>`;
    }

    function generatePopupScript() {
        return `<script>
(() => {
    const KEYS = ${JSON.stringify(STORAGE_KEYS)};
    
    const elements = {
        fontSize: document.getElementById('fontSizeInput'),
        sound: document.getElementById('soundCheckbox'),
        score: document.getElementById('scoreDisplay'),
        time: document.getElementById('timeDisplay'),
        autoReload: document.getElementById('autoReloadCheckbox'),
        autoReloadSec: document.getElementById('autoReloadSec')
    };

    const savedFontSize = localStorage.getItem(KEYS.FONT_SIZE);
    const savedAutoReloadSec = localStorage.getItem(KEYS.AUTO_RELOAD_SECONDS);

    elements.fontSize.value = String(savedFontSize ?? '60');
    elements.sound.checked = false;
    localStorage.setItem(KEYS.SOUND, '0');
    elements.autoReload.checked = false;
    elements.autoReloadSec.value = String(savedAutoReloadSec ?? '600');
    elements.score.style.fontSize = (elements.fontSize.value || '60') + 'px';

    localStorage.setItem(KEYS.POPUP_ALIVE, '1');
    
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('faceit-score');
        
        channel.addEventListener('message', (e) => {
            if (e.data.type === 'checkPopupAlive') {
                channel.postMessage({ type: 'popupAliveResponse' });
            }
        });
        
        setTimeout(() => {
            channel.postMessage({ type: 'popupAlive' });
        }, 50);
    }
    
    window.addEventListener('beforeunload', () => {
        localStorage.removeItem(KEYS.POPUP_ALIVE);
    });

    elements.fontSize.addEventListener('input', () => {
        localStorage.setItem(KEYS.FONT_SIZE, elements.fontSize.value || '60');
        elements.score.style.fontSize = (elements.fontSize.value || '60') + 'px';
    });

    elements.sound.addEventListener('change', () => {
        localStorage.setItem(KEYS.SOUND, elements.sound.checked ? '1' : '0');
        lastPlayedScore = null;
        
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    elements.autoReload.addEventListener('change', () => {
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    elements.autoReloadSec.addEventListener('input', () => {
        localStorage.setItem(KEYS.AUTO_RELOAD_SECONDS, elements.autoReloadSec.value || '');
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('faceit-score');
        channel.addEventListener('message', (e) => {
            const data = e.data || {};
            if (data.type === 'update') {
                if (data.fontSize !== undefined) {
                    elements.fontSize.value = String(data.fontSize);
                    elements.score.style.fontSize = data.fontSize + 'px';
                }
                if (data.scoreTeam1 !== undefined && data.scoreTeam2 !== undefined) {
                    elements.score.textContent = data.scoreTeam1 + ' - ' + data.scoreTeam2;
                }
                if (data.matchTime !== undefined) {
                    if (!elements.time) elements.time = document.getElementById('timeDisplay');
                    if (data.matchTime) {
                        elements.time.textContent = data.matchTime;
                        elements.time.style.display = 'block';
                    } else {
                        elements.time.textContent = 'Ожидание...';
                        elements.time.style.display = 'block';
                    }
                }
            }
            if (data.type === 'playSound' && data.score && data.score !== lastPlayedScore) {
                lastPlayedScore = data.score;
                playNotificationSound();
            }
        });
    }

    let notificationAudio = null;
    let audioUnlocked = false;
    let lastPlayedScore = null;

    function playNotificationSound() {
        try {
            const audio = new Audio('${CONFIG.SOUND_URL}');
            audio.preload = 'auto';
            audio.currentTime = 0;
            audio.volume = 1.0;
            
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name === 'NotAllowedError') {
                        unlockAudio();
                        audio.play().catch(() => {});
                    }
                });
            }
        } catch (error) {
            unlockAudio();
        }
    }

    function unlockAudio() {
        try {
            if (!notificationAudio) {
                notificationAudio = new Audio('${CONFIG.SOUND_URL}');
                notificationAudio.preload = 'auto';
            }
            
            if (audioUnlocked) return;
            
            notificationAudio.muted = true;
            notificationAudio.volume = 0.01;
            notificationAudio.currentTime = 0;
            
            notificationAudio.play().then(() => {
                notificationAudio.pause();
                notificationAudio.muted = false;
                notificationAudio.volume = 1.0;
                audioUnlocked = true;
            }).catch(() => {
                audioUnlocked = false;
            });
        } catch {}
    }

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    
    unlockAudio();
    
    try {
        const preloadAudio = new Audio('${CONFIG.SOUND_URL}');
        preloadAudio.preload = 'auto';
        preloadAudio.load();
        
        preloadAudio.muted = true;
        preloadAudio.volume = 0.01;
        preloadAudio.play().then(() => {
            preloadAudio.pause();
            audioUnlocked = true;
        }).catch(() => {});
    } catch {}
    
    setTimeout(() => {
        if (!audioUnlocked) {
            unlockAudio();
        }
    }, ${CONFIG.AUDIO_UNLOCK_DELAY});
})();
</script>`;
    }

    // ============================================================================
    // УПРАВЛЕНИЕ POPUP ОКНОМ
    // ============================================================================

    function ensurePopupContent() {
        if (!isPopupAlive()) return false;
        
        try {
            const hasContent = !!scoreWindow.document.getElementById('scoreDisplay');
            if (!hasContent) {
                return writePopupHTML(scoreWindow);
            }
            return true;
        } catch {
            return false;
        }
    }
    
    function setupPopupEvents() {
        if (!isPopupAlive()) return;
        
        try {
            scoreWindow.addEventListener('beforeunload', () => {
                localStorage.removeItem(STORAGE_KEYS.POPUP_ALIVE);
                localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                isScriptActive = false;
                stopUpdateInterval();
                scoreWindow = null;
                
                const button = document.querySelector('button[style*="position: fixed"]');
                if (button) {
                    button.textContent = 'Показать счет';
                    button.style.backgroundColor = '#4CAF50';
                }
                
                if (scoreChannel) {
                    try {
                        scoreChannel.postMessage({ type: 'forceClosePopup' });
                    } catch {}
                }
            });
            
            scoreWindow.addEventListener('blur', () => {
                setTimeout(() => {
                    if (!isPopupAlive()) {
                        localStorage.removeItem(STORAGE_KEYS.POPUP_ALIVE);
                        localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
                        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                        isScriptActive = false;
                        stopUpdateInterval();
                        scoreWindow = null;
                        
                        const button = document.querySelector('button[style*="position: fixed"]');
                        if (button) {
                            button.textContent = 'Показать счет';
                            button.style.backgroundColor = '#4CAF50';
                        }
                        
                        if (scoreChannel) {
                            try {
                                scoreChannel.postMessage({ type: 'forceClosePopup' });
                            } catch {}
                        }
                    }
                }, CONFIG.POPUP_UPDATE_DELAY);
            });
        } catch {}
    }

    function startPopupKeepAlive() {
        if (!isScriptActive) return; // Не запускаем если скрипт неактивен
        clearInterval(popupKeepAliveTimer);
        popupKeepAliveTimer = setInterval(() => {
            if (!isPopupAlive()) {
                if (isScriptActive) {
                    localStorage.removeItem(STORAGE_KEYS.POPUP_ALIVE);
                    localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
                    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                    isScriptActive = false;
                    stopUpdateInterval();
                    
                    // Агрессивно закрываем popup
                    try {
                        if (scoreWindow && !scoreWindow.closed) {
                            scoreWindow.close();
                        }
                    } catch {}
                    
                    try {
                        const popups = window.open('', 'ScoreWindow');
                        if (popups && !popups.closed) {
                            popups.close();
                        }
                    } catch {}
                    
                    scoreWindow = null;
                    
                    const button = document.querySelector('button[style*="position: fixed"]');
                    if (button) {
                        updateButtonText('Показать счет', '#4CAF50', button);
                    }
                    
                    if (scoreChannel) {
                        try {
                            scoreChannel.postMessage({ type: 'forceClosePopup' });
                        } catch {}
                    }
                }
                return;
            }
            
            try {
                const hasContent = !!scoreWindow.document.getElementById('scoreDisplay');
                if (!hasContent) {
                    writePopupHTML(scoreWindow);
                }
            } catch {}
        }, CONFIG.POPUP_KEEP_ALIVE_INTERVAL);
    }

    // ============================================================================
    // УПРАВЛЕНИЕ ИНТЕРВАЛАМИ И ОБНОВЛЕНИЯМИ
    // ============================================================================

    function updateScore() {
        if (!isScriptActive) return;
        if (isUpdating) return;
        isUpdating = true;

        try {
            const currentUrl = window.location.href;
            const isMatchPage = CONFIG.MATCH_URL_PATTERNS.some(pattern => currentUrl.includes(pattern));
            
            // Если не на странице матча, все равно обновляем popup (показываем "Ожидание...")
            if (!isMatchPage) {
                if (isPopupAlive()) {
                    const settings = getSettings();
                    updatePopupDisplay('Ожидание...', '', settings.fontSize, '');
                }
                return;
            }
            
            const now = Date.now();
            if (currentUrl !== lastMatchPageUrl) {
                lastMatchPageTime = now;
                lastMatchPageUrl = currentUrl;
            }
            
            // Если не прошло время загрузки, пропускаем но не останавливаем
            if (now - lastMatchPageTime < CONFIG.MATCH_PAGE_LOAD_DELAY) {
                return;
            }

        const settings = getSettings();
        sendScoreToPopup(settings.fontSize, settings.soundEnabled);
        } finally {
        isUpdating = false;
        }
    }

    function startUpdateInterval() {
        clearInterval(updateInterval);
        clearInterval(fastCheckInterval);
        
        // Проверяем при старте есть ли завершенный матч
        setTimeout(() => {
            const { timeElement } = findScores();
            if (timeElement) {
                const matchTime = timeElement.textContent.trim();
                const isFinished = matchTime && (
                    matchTime.toLowerCase() === 'finished' || 
                    matchTime.toLowerCase().includes('finished')
                );
                if (isFinished) {
                    tryToRevealTooltip();
                }
            }
        }, 0);
        
        updateInterval = setInterval(updateScore, CONFIG.UPDATE_INTERVAL);
        fastCheckInterval = setInterval(() => {
            if (isScriptActive) {
                updateScore();
            }
        }, CONFIG.FAST_CHECK_INTERVAL);
    }

    function stopUpdateInterval() {
        clearInterval(updateInterval);
        clearInterval(fastCheckInterval);
        clearInterval(urlTrackingInterval);
        clearInterval(tooltipCheckTimer);
        clearInterval(autoReloadTimer);
        stopInactiveTabMonitoring();
        stopAllAdvancedTricks();
        stopTooltipObserver();
        stopAutoHover();
        
        localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
        isScriptActive = false;
        
        // Освобождаем приоритет только если мы были активной вкладкой
        try {
            const currentTab = getCurrentTabUrl();
            const activeTab = getActiveTabFromStorage();
            if (currentTab === activeTab) {
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL + '_timestamp');
            }
            localStorage.removeItem(STORAGE_KEYS.INACTIVE_TAB_DATA);
        } catch {}
    }

    function applyAutoReloadPolicy() {
        clearInterval(autoReloadTimer);
        try {
            const enabled = localStorage.getItem(STORAGE_KEYS.AUTO_RELOAD_ENABLED) === '1';
            const seconds = Number(localStorage.getItem(STORAGE_KEYS.AUTO_RELOAD_SECONDS) || '0');
            const ms = seconds * 1000;
            
            if (enabled && ms >= CONFIG.AUTO_RELOAD_MIN_MS && isScriptActive) {
                autoReloadTimer = setInterval(() => {
                    if (!isScriptActive) {
                        clearInterval(autoReloadTimer);
                        return;
                    }
                    location.reload();
                }, ms);
            }
        } catch {}
    }

    // ============================================================================
    // ОБРАБОТЧИКИ КНОПКИ
    // ============================================================================

    function closePopupAndDeactivate() {
        // Агрессивно закрываем popup
        try {
            if (scoreWindow && !scoreWindow.closed) {
                scoreWindow.close();
            }
        } catch {}
        
        // Пытаемся закрыть все окна с именем ScoreWindow
        try {
            const popups = window.open('', 'ScoreWindow');
            if (popups && !popups.closed) {
                popups.close();
            }
        } catch {}
        
        scoreWindow = null;
        
        // Очищаем все флаги
        localStorage.removeItem(STORAGE_KEYS.POPUP_ALIVE);
        localStorage.removeItem(STORAGE_KEYS.SCRIPT_ACTIVE);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_URL);
        
        stopUpdateInterval();
        isScriptActive = false;
        
        try {
            localStorage.removeItem(STORAGE_KEYS.INACTIVE_TAB_DATA);
        } catch {}
        
        lastScore = null;
        lastMatchPageTime = 0;
        lastMatchPageUrl = '';
        
        // Уведомляем все вкладки о закрытии
        if (scoreChannel) {
            try {
                scoreChannel.postMessage({ type: 'forceClosePopup' });
                scoreChannel.postMessage({ type: 'buttonUpdate', text: 'Показать счет', color: '#4CAF50' });
            } catch {}
        }
    }

    function handleButtonClick() {
        if (isScriptActive && isPopupAlive()) {
            closePopupAndDeactivate();
            updateButtonText('Показать счет', '#4CAF50');
            return;
        }
        
        isScriptActive = true;
        localStorage.setItem(STORAGE_KEYS.SCRIPT_ACTIVE, '1');
        lastScore = null;
        lastMatchPageTime = 0;
        lastMatchPageUrl = '';
        
        try {
            localStorage.removeItem(STORAGE_KEYS.INACTIVE_TAB_DATA);
        } catch {}
        
        if (!isPopupAlive()) {
            scoreWindow = window.open('', 'ScoreWindow', 
                `width=${CONFIG.POPUP_WIDTH_OPEN},height=${CONFIG.POPUP_HEIGHT_OPEN},menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes`);
        }
        
        localStorage.setItem(STORAGE_KEYS.POPUP_ALIVE, '1');
        
        ensurePopupContent();
        setupPopupEvents();
        
        setTimeout(() => {
            const settings = getSettings();
            sendScoreToPopup(settings.fontSize, settings.soundEnabled);
        }, CONFIG.POPUP_UPDATE_DELAY);
        
        startUpdateInterval();
        startPopupKeepAlive();
        startInactiveTabMonitoring();
        startAggressiveMonitoring();
        startAllAdvancedTricks();
        
        // Запускаем urlTrackingInterval если еще не запущен
        if (!urlTrackingInterval) {
            let lastUrl = window.location.href;
            urlTrackingInterval = setInterval(() => {
                if (!isScriptActive) return; // Не работаем если скрипт неактивен
                
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    if (isPopupAlive()) {
                        const settings = getSettings();
                        sendScoreToPopup(settings.fontSize, settings.soundEnabled);
                    }
                }
            }, 100);
        }
        
        applyAutoReloadPolicy();
        
        updateButtonText('Скрыть счет', '#f44336');
    }

    // ============================================================================
    // ИНИЦИАЛИЗАЦИЯ СКРИПТА
    // ============================================================================

    function initialize() {
        lastScore = null;
        
        // Создаем кнопку
        button = createButton();
        button.addEventListener('click', handleButtonClick);
        
        if (isPopupAliveViaStorage()) {
            isScriptActive = true;
            localStorage.setItem(STORAGE_KEYS.SCRIPT_ACTIVE, '1');
            updateButtonText('Скрыть счет', '#f44336');
            
        startUpdateInterval();
            startPopupKeepAlive();
            
            setTimeout(() => {
                startInactiveTabMonitoring();
                startAggressiveMonitoring();
                startAllAdvancedTricks();
            }, 100);
        }
        
        // Загружаем состояние видимости кнопки
        const buttonVisible = loadButtonVisibility();
        if (!buttonVisible) {
            hideMainButton();
        } else {
            button.style.display = 'flex';
        }
        
        // Запускаем urlTrackingInterval только если скрипт активен
        if (isScriptActive) {
        let lastUrl = window.location.href;
        urlTrackingInterval = setInterval(() => {
                if (!isScriptActive) return; // Не работаем если скрипт неактивен
                
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                    if (isPopupAlive()) {
                    const settings = getSettings();
                    sendScoreToPopup(settings.fontSize, settings.soundEnabled);
                }
            }
        }, 100);
            
            applyAutoReloadPolicy();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
