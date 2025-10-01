// ==UserScript==
// @name         Faceit Score Display
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Отображение счета матча в отдельном окне с настройками шрифта, звуком и автообновлением
// @author       Gariloz
// @match        https://*.faceit.com/*
// @grant        window.open
// ==/UserScript==

(function() {
    'use strict';

    // === КОНФИГУРАЦИЯ ===
    const CONFIG = {
        FONT_SIZE: 60,                    // Размер шрифта счета по умолчанию (пиксели)
        SOUND_ENABLED: true,              // Включить звуковые уведомления по умолчанию
        AUTO_RELOAD_ENABLED: true,        // Включить автообновление страницы по умолчанию
        AUTO_RELOAD_SECONDS: 600,         // Интервал автообновления страницы (секунды)
        SOUND_URL: 'https://cdn-frontend.faceit-cdn.net/web-next/_next/static/media/found-tone-silly.mp3', // URL звука уведомления
        UPDATE_INTERVAL: 100              // Частота обновления счета (миллисекунды) - всегда быстро для мгновенных уведомлений
    };

    // === СЕЛЕКТОРЫ ДЛЯ ПОИСКА СЧЕТА ===
    const SELECTORS = {
        // Основные селекторы для поиска счета (если перестанут работать - добавьте новые)
        SCORE_ELEMENTS: [
            'h3[class*="FactionsDetails__FactionScore"]',     // Основной селектор
            'h3[class*="MatchScore__"]',                      // Резервный селектор 1
            '.score-display h3',                              // Резервный селектор 2
            '[data-testid="team-score"]'                      // Резервный селектор 3
        ],
        
        // Контейнеры где искать счет
        SCORE_CONTAINERS: [
            '[class*="FactionsDetails__Container"]',
            '[class*="Header__Container"]',
            '[class*="MatchHeader__"]',
            '.match-score-container'
        ],
        
        // Для резервного поиска - классы которые должны содержать элементы со счетом
        FALLBACK_CLASS_PATTERNS: [
            'FactionsDetails__',
            'MatchScore__',
            'TeamScore__'
        ]
    };

    // === КЛЮЧИ ЛОКАЛЬНОГО ХРАНИЛИЩА ===
    const STORAGE_KEYS = {
        FONT_SIZE: 'faceitScoreFontSize',
        SOUND: 'faceitScoreSound',
        SCORE_PAYLOAD: 'faceitScorePayload',
        AUTO_RELOAD_ENABLED: 'faceitScoreAutoReloadEnabled',
        AUTO_RELOAD_SECONDS: 'faceitScoreAutoReloadMs'
    };

    // === ИНИЦИАЛИЗАЦИЯ НАСТРОЕК ===
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
    // === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
    let scoreWindow = null;
    let lastScore = null;
    let isUpdating = false;
    let updateInterval = null;
    let audioUnlocked = false;
    let notificationAudio = null;
    let popupKeepAliveTimer = null;
    let autoReloadTimer = null;

    const scoreChannel = (typeof BroadcastChannel !== 'undefined') 
        ? new BroadcastChannel('faceit-score') 
        : null;

    // Слушаем изменения настроек из попапа
    if (scoreChannel) {
        scoreChannel.addEventListener('message', (e) => {
            if (e.data.type === 'settingsChanged') {
                applyAutoReloadPolicy(); // Перезапускаем автообновление с новыми настройками
            }
        });
    }

    // Резервный канал - слушаем изменения через localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.AUTO_RELOAD_ENABLED || e.key === STORAGE_KEYS.AUTO_RELOAD_SECONDS) {
            applyAutoReloadPolicy(); // Перезапускаем автообновление при изменении настроек
        }
        // Настройки звука тоже могут измениться
        if (e.key === STORAGE_KEYS.SOUND) {
            // Звуковые настройки обновятся автоматически при следующем вызове getSettings()
        }
    });

    // === СОЗДАНИЕ КНОПКИ ===
    function createButton() {
        const button = document.createElement('button');
        Object.assign(button.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '2147483647',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
        });
        button.textContent = 'Показать счет';
        document.body.appendChild(button);
        return button;
    }

    // === ПОИСК ЭЛЕМЕНТОВ СЧЕТА ===
    function findScores() {
        // 1. Основной поиск по всем селекторам
        for (const selector of SELECTORS.SCORE_ELEMENTS) {
            const scoreNodes = document.querySelectorAll(selector);
            if (scoreNodes.length >= 2) {
                return { 
                    scoreTeam1Element: scoreNodes[0], 
                    scoreTeam2Element: scoreNodes[1] 
                };
            }
        }

        // 2. Поиск внутри контейнеров
        for (const containerSelector of SELECTORS.SCORE_CONTAINERS) {
            const container = document.querySelector(containerSelector);
            if (container) {
                for (const selector of SELECTORS.SCORE_ELEMENTS) {
                    const scoreNodes = container.querySelectorAll(selector);
                    if (scoreNodes.length >= 2) {
                        return { 
                            scoreTeam1Element: scoreNodes[0], 
                            scoreTeam2Element: scoreNodes[1] 
                        };
                    }
                }
            }
        }

        // 3. Резервный поиск по содержимому и классам
        const fallbackNodes = Array.from(document.querySelectorAll('h3, div, span'))
            .filter(el => {
                const text = el.textContent?.trim() || '';
                const hasNumber = /\b\d+\b/.test(text);
                const hasRelevantClass = SELECTORS.FALLBACK_CLASS_PATTERNS.some(pattern => 
                    el.className.includes(pattern)
                );
                return hasNumber && hasRelevantClass;
            });

        return fallbackNodes.length >= 2 
            ? { scoreTeam1Element: fallbackNodes[0], scoreTeam2Element: fallbackNodes[1] }
            : { scoreTeam1Element: null, scoreTeam2Element: null };
    }

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    function isPopupAlive() {
        try {
            return !!(scoreWindow && !scoreWindow.closed);
        } catch {
            return false;
        }
    }

    function getSettings() {
        return {
            fontSize: Number(localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || CONFIG.FONT_SIZE),
            soundEnabled: localStorage.getItem(STORAGE_KEYS.SOUND) === '1'
        };
    }

    // === ОБНОВЛЕНИЕ СЧЕТА ===
    function sendScoreToPopup(fontSize, playSound) {
        const { scoreTeam1Element, scoreTeam2Element } = findScores();
        if (!scoreTeam1Element || !scoreTeam2Element) return;

        const scoreTeam1 = scoreTeam1Element.textContent.trim() || '0';
        const scoreTeam2 = scoreTeam2Element.textContent.trim() || '0';
        const currentScore = `${scoreTeam1}-${scoreTeam2}`;

        // Проверяем изменение счета для звукового уведомления
        if (currentScore !== lastScore && playSound) {
            lastScore = currentScore;
            playNotificationSound();
        }

        // Обновляем попап если он открыт
        if (isPopupAlive()) {
            updatePopupDisplay(scoreTeam1, scoreTeam2, fontSize);
        }

        // Отправляем данные через каналы связи
        broadcastScoreUpdate(scoreTeam1, scoreTeam2, fontSize);
    }

    function updatePopupDisplay(scoreTeam1, scoreTeam2, fontSize) {
        try {
            const doc = scoreWindow.document;
            const scoreDisplay = doc.getElementById('scoreDisplay');
            const fontSizeInput = doc.getElementById('fontSizeInput');
            
            if (scoreDisplay) {
                scoreDisplay.textContent = `${scoreTeam1} - ${scoreTeam2}`;
                scoreDisplay.style.fontSize = `${fontSize}px`;
            }
            if (fontSizeInput) {
                fontSizeInput.value = String(fontSize);
            }
        } catch {}
    }

    function broadcastScoreUpdate(scoreTeam1, scoreTeam2, fontSize) {
        try {
            scoreChannel?.postMessage({ type: 'update', scoreTeam1, scoreTeam2, fontSize });
            localStorage.setItem(STORAGE_KEYS.SCORE_PAYLOAD, 
                JSON.stringify({ t: Date.now(), scoreTeam1, scoreTeam2, fontSize }));
        } catch {}
    }

    // === СОЗДАНИЕ HTML ДЛЯ ПОПАПА ===
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
            padding: 8px; 
            overflow: hidden; 
        }
        .score { 
            font-size: 60px; 
            font-weight: bold; 
            margin: 0; 
            line-height: 1.1; 
        }
        .row { 
            margin: 6px 0; 
            font-size: 14px; 
        }
        input[type=number] { 
            text-align: center; 
        }
        .control-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="score" id="scoreDisplay">Загрузка...</div>
    <div class="row">
        <label for="fontSizeInput">Размер шрифта (px)</label>
        <input type="number" id="fontSizeInput" value="60" style="width:90px;margin-left:6px;">
    </div>
    <label class="row control-group">
        <input type="checkbox" id="soundCheckbox"> Звуковое оповещение
    </label>
    <div class="row control-group">
        <label class="control-group">
            <input type="checkbox" id="autoReloadCheckbox"> Авто-перезагрузка
        </label>
        <input type="number" id="autoReloadSec" min="5" step="1" placeholder="сек" style="width:80px;">
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
        autoReload: document.getElementById('autoReloadCheckbox'),
        autoReloadSec: document.getElementById('autoReloadSec')
    };

    // Инициализация значений
    elements.fontSize.value = localStorage.getItem(KEYS.FONT_SIZE) || '60';
    elements.sound.checked = localStorage.getItem(KEYS.SOUND) === '1';
    elements.score.style.fontSize = elements.fontSize.value + 'px';
    elements.autoReload.checked = localStorage.getItem(KEYS.AUTO_RELOAD_ENABLED) === '1';
    elements.autoReloadSec.value = localStorage.getItem(KEYS.AUTO_RELOAD_SECONDS) || '';

    // Обработчики событий
    elements.fontSize.addEventListener('input', () => {
        localStorage.setItem(KEYS.FONT_SIZE, elements.fontSize.value || '60');
        elements.score.style.fontSize = (elements.fontSize.value || '60') + 'px';
    });

    elements.sound.addEventListener('change', () => {
        localStorage.setItem(KEYS.SOUND, elements.sound.checked ? '1' : '0');
        // Уведомляем основной скрипт об изменении настроек звука
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    elements.autoReload.addEventListener('change', () => {
        localStorage.setItem(KEYS.AUTO_RELOAD_ENABLED, elements.autoReload.checked ? '1' : '0');
        // Уведомляем основной скрипт об изменении настроек
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    elements.autoReloadSec.addEventListener('input', () => {
        localStorage.setItem(KEYS.AUTO_RELOAD_SECONDS, elements.autoReloadSec.value || '');
        // Уведомляем основной скрипт об изменении настроек
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('faceit-score');
            channel.postMessage({ type: 'settingsChanged' });
        }
    });

    // BroadcastChannel для обновлений
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
            }
        });
    }

    // Резервный канал через localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === KEYS.SCORE_PAYLOAD && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.fontSize !== undefined) {
                    elements.fontSize.value = String(data.fontSize);
                    elements.score.style.fontSize = data.fontSize + 'px';
                }
                if (data.scoreTeam1 !== undefined && data.scoreTeam2 !== undefined) {
                    elements.score.textContent = data.scoreTeam1 + ' - ' + data.scoreTeam2;
                }
            } catch {}
        }
    });
})();
</script>`;
    }

    // === УПРАВЛЕНИЕ ПОПАПОМ ===
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

    function startPopupKeepAlive() {
        clearInterval(popupKeepAliveTimer);
        popupKeepAliveTimer = setInterval(() => {
            if (!isPopupAlive()) return;
            
            try {
                const hasContent = !!scoreWindow.document.getElementById('scoreDisplay');
                if (!hasContent) {
                    writePopupHTML(scoreWindow);
                }
            } catch {}
        }, 1000);
    }

    // === АВТООБНОВЛЕНИЕ СТРАНИЦЫ ===
    function applyAutoReloadPolicy() {
        clearInterval(autoReloadTimer);
        try {
            const enabled = localStorage.getItem(STORAGE_KEYS.AUTO_RELOAD_ENABLED) === '1';
            const seconds = Number(localStorage.getItem(STORAGE_KEYS.AUTO_RELOAD_SECONDS) || '0');
            const ms = seconds * 1000;
            
            if (enabled && ms >= 5000) {
                autoReloadTimer = setInterval(() => location.reload(), ms);
            }
        } catch {}
    }

    // === ЗВУКОВЫЕ УВЕДОМЛЕНИЯ ===
    function playNotificationSound() {
        if (!audioUnlocked) return;
        
        try {
            if (!notificationAudio) {
                notificationAudio = new Audio(CONFIG.SOUND_URL);
            }
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(() => {});
        } catch {}
    }

    function unlockAudio() {
        try {
            if (!notificationAudio) {
                notificationAudio = new Audio(CONFIG.SOUND_URL);
            }
            notificationAudio.muted = true;
            notificationAudio.play().then(() => {
                notificationAudio.pause();
                notificationAudio.muted = false;
                audioUnlocked = true;
            }).catch(() => {});
        } catch {}
    }

    // === ОБНОВЛЕНИЕ СЧЕТА ===
    function updateScore() {
        if (isUpdating) return;
        isUpdating = true;

        const settings = getSettings();
        sendScoreToPopup(settings.fontSize, settings.soundEnabled);

        isUpdating = false;
    }

    function startUpdateInterval() {
        clearInterval(updateInterval);
        updateInterval = setInterval(updateScore, CONFIG.UPDATE_INTERVAL);
    }

    function stopUpdateInterval() {
        clearInterval(updateInterval);
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    function handleButtonClick() {
        if (!isPopupAlive()) {
            scoreWindow = window.open('', 'ScoreWindow', 
                'width=320,height=220,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes');
        }
        
        ensurePopupContent();
        startUpdateInterval();
        startPopupKeepAlive();
        unlockAudio();
    }

    function handleVisibilityChange() {
        // Всегда обновляем быстро для мгновенных уведомлений!
        // Неважно активна вкладка или нет - главное не пропустить изменение счета
        startUpdateInterval();
    }

    function handleDOMChanges() {
        if (!isUpdating) {
            updateScore();
        }
    }

    // === ИНИЦИАЛИЗАЦИЯ ===
    function initialize() {
        const button = createButton();
        button.addEventListener('click', handleButtonClick);
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Наблюдение за изменениями DOM
        let observeTarget = null;
        for (const containerSelector of SELECTORS.SCORE_CONTAINERS) {
            observeTarget = document.querySelector(containerSelector);
            if (observeTarget) break;
        }
        observeTarget = observeTarget || document.body;
        new MutationObserver(handleDOMChanges).observe(observeTarget, { 
            childList: true, 
            subtree: true, 
            attributes: true 
        });

        // Запуск обновлений
        startUpdateInterval();
        updateScore();
        applyAutoReloadPolicy();
    }

    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
