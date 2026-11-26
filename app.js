/* =========================================================================
   КОНФИГУРАЦИЯ ОБЛАЧНОГО ХРАНИЛИЩА SUPABASE
   Чтобы посты и видео видели все посетители, вставьте свои ключи из
   Supabase Dashboard -> Project Settings -> API (иначе работает локальный режим).
   ========================================================================= */
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
const SUPABASE_BUCKET = 'media';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* =========================================================================
   1. БЕЗОПАСНОСТЬ И УМНЫЙ ПАРСЕР ССЫЛОК (GOOGLE ДИСК, YOUTUBE, VK, RUTUBE)
   ========================================================================= */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const u = url.trim();
    return /^(https?:\/\/|blob:|idb:\/\/|data:image\/|data:video\/|data:audio\/)/i.test(u);
}

function extractGDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed.includes('drive.google.com') && !trimmed.includes('docs.google.com')) return null;
    const m1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
}

function resolveCoverUrl(url) {
    if (!isSafeUrl(url)) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('idb://') && mediaBlobCache[trimmed]) {
        return mediaBlobCache[trimmed];
    }
    const gdId = extractGDriveId(trimmed);
    if (gdId) return `https://lh3.googleusercontent.com/d/${gdId}`;
    return trimmed;
}

function resolvePlayableUrl(url) {
    if (!isSafeUrl(url)) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('idb://') && mediaBlobCache[trimmed]) {
        return mediaBlobCache[trimmed];
    }
    return trimmed;
}

function renderVideoPlayerHTML(rawUrl, coverUrl = '') {
    const url = resolvePlayableUrl(rawUrl);
    if (!url) return '';

    const gdId = extractGDriveId(url);
    if (gdId) {
        return `
            <div class="rounded-sm overflow-hidden border hairline bg-ink">
                <iframe src="https://drive.google.com/file/d/${escapeHtml(gdId)}/preview"
                        class="blog-video-player border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowfullscreen loading="lazy"
                        title="Видеоплеер Google Диск"></iframe>
                <div class="px-3 py-1.5 bg-craft border-t hairline text-[11px] text-ink/75">
                    Google Диск · Видео со звуком (файл должен быть открыт по ссылке)
                </div>
            </div>`;
    }

    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (ytMatch) {
        return `<iframe src="https://www.youtube.com/embed/${escapeHtml(ytMatch[1])}" class="blog-video-player border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy" title="YouTube плеер"></iframe>`;
    }

    const rtMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
    if (rtMatch) {
        return `<iframe src="https://rutube.ru/play/embed/${escapeHtml(rtMatch[1])}" class="blog-video-player border-0" allow="clipboard-write; autoplay; fullscreen" allowfullscreen loading="lazy" title="Rutube плеер"></iframe>`;
    }

    const vkMatch = url.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/);
    if (vkMatch) {
        return `<iframe src="https://vk.com/video_ext.php?oid=${escapeHtml(vkMatch[1])}&id=${escapeHtml(vkMatch[2])}&hd=2" class="blog-video-player border-0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="VK Видео плеер"></iframe>`;
    }

    const poster = resolveCoverUrl(coverUrl);
    const posterAttr = poster ? `poster="${escapeHtml(poster)}"` : '';
    return `<video src="${escapeHtml(url)}" ${posterAttr} controls playsinline preload="metadata" class="blog-video-player"></video>`;
}

function renderAudioPlayerHTML(rawUrl) {
    const url = resolvePlayableUrl(rawUrl);
    if (!url) return '';

    const gdId = extractGDriveId(url);
    if (gdId) {
        return `
            <div class="rounded-sm overflow-hidden border hairline bg-parchment">
                <iframe src="https://drive.google.com/file/d/${escapeHtml(gdId)}/preview"
                        class="w-full h-[88px] border-0 block bg-parchment"
                        allow="autoplay"
                        loading="lazy"
                        title="Аудиоплеер Google Диск"></iframe>
                <div class="px-3 py-1.5 bg-craft border-t hairline text-[11px] text-ink/75">
                    Google Диск · Аудиозапись (убедитесь, что включён доступ по ссылке)
                </div>
            </div>`;
    }

    return `
        <div class="p-3 bg-parchment border hairline rounded-sm">
            <audio src="${escapeHtml(url)}" controls preload="metadata" class="w-full block"></audio>
        </div>`;
}

/* =========================================================================
   2. ГЕНЕРАТОРЫ ПОДЛИННЫХ ВЕКТОРНЫХ ОРНАМЕНТОВ
   ========================================================================= */
function getMezenFriezeSVG() {
    return `<svg viewBox="0 0 640 310" class="w-full h-auto block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Мезенская роспись">
        <rect width="640" height="310" fill="#F6EFE4"/>
        <rect x="0" y="10" width="640" height="5" fill="#A63426"/><rect x="0" y="18" width="640" height="2" fill="#1F1D1A"/>
        <g stroke="#1F1D1A" stroke-width="1.4" fill="none">
            ${Array.from({ length: 16 }, (_, i) => {
                const x = i * 40;
                return `<polygon points="${x + 20},23 ${x + 38},41 ${x + 20},59 ${x + 2},41" fill="${i % 2 === 0 ? '#A63426' : '#F6EFE4'}" stroke="#1F1D1A" stroke-width="1.4"/><polygon points="${x + 20},31 ${x + 30},41 ${x + 20},51 ${x + 10},41" fill="${i % 2 === 0 ? '#F6EFE4' : '#A63426'}" stroke="#1F1D1A" stroke-width="1.1"/><circle cx="${x + 20}" cy="41" r="2.2" fill="#1F1D1A"/>`;
            }).join('')}
        </g>
        <rect x="0" y="62" width="640" height="2" fill="#1F1D1A"/><rect x="0" y="67" width="640" height="4" fill="#A63426"/>
        <g stroke="#A63426" stroke-width="1.5" fill="none">
            <circle cx="98" cy="100" r="10"/><circle cx="98" cy="100" r="3" fill="#A63426"/><path d="M98,84 V90 M98,110 V116 M82,100 H88 M108,100 H114"/>
            <circle cx="318" cy="98" r="11"/><circle cx="318" cy="98" r="3.5" fill="#1F1D1A"/><path d="M318,81 V87 M318,109 V115 M301,98 H307 M329,98 H335" stroke="#1F1D1A"/>
            <circle cx="538" cy="100" r="10"/><circle cx="538" cy="100" r="3" fill="#A63426"/><path d="M538,84 V90 M538,110 V116 M522,100 H528 M548,100 H554"/>
        </g>
        ${[{ tx: 30, b: '#A63426', a: '#1F1D1A' }, { tx: 235, b: '#1F1D1A', a: '#A63426' }, { tx: 440, b: '#A63426', a: '#1F1D1A' }].map(h => `
            <g transform="translate(${h.tx},102)">
                <path d="M114,44 C122,22 135,10 148,10 C156,10 163,16 168,24 C160,26 153,24 148,22 C142,27 137,39 135,54 Z" fill="${h.b}"/>
                <path d="M145,10 L149,2 L152,11" fill="${h.b}"/>
                <path d="M118,34 L110,27 M122,27 L114,20 M127,21 L120,14 M133,15 L127,9 M140,11 L136,4" stroke="${h.a}" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M44,54 C62,48 102,48 135,54 C132,74 122,82 104,80 C84,78 68,82 48,79 C38,77 36,64 44,54 Z" fill="${h.b}"/>
                <path d="M62,56 L78,76 M74,55 L90,77 M86,55 L102,77 M78,55 L62,76 M90,55 L74,77" stroke="#F6EFE4" stroke-width="1.1" opacity="0.85"/>
                <path d="M44,58 C26,56 14,68 10,88 C18,80 26,76 34,76" fill="none" stroke="${h.b}" stroke-width="3.2" stroke-linecap="round"/>
                <path d="M22,74 L14,88 M28,74 L22,90 M34,75 L30,90" stroke="${h.a}" stroke-width="1.4" stroke-linecap="round"/>
                <g stroke="${h.a}" stroke-width="2.1" stroke-linecap="round" fill="none">
                    <path d="M52,78 L36,104 L22,126"/><path d="M62,79 L54,106 L44,126"/>
                    <path d="M116,78 L134,102 L148,124"/><path d="M126,76 L148,96 L166,114"/>
                </g>
            </g>`).join('')}
        <rect x="0" y="238" width="640" height="4" fill="#A63426"/><rect x="0" y="245" width="640" height="2" fill="#1F1D1A"/>
        <g>${Array.from({ length: 16 }, (_, i) => { const x = i * 40; return `<polygon points="${x},290 ${x + 20},250 ${x + 40},290" fill="${i % 2 === 0 ? '#1F1D1A' : '#A63426'}"/><polygon points="${x + 9},290 ${x + 20},268 ${x + 31},290" fill="#F6EFE4"/>`; }).join('')}</g>
        <rect x="0" y="293" width="640" height="2" fill="#1F1D1A"/><rect x="0" y="298" width="640" height="5" fill="#A63426"/>
    </svg>`;
}

function getOrnamentTileSVG(id) {
    if (id === 'mezen') {
        return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="10" y="14" width="180" height="5" fill="#A63426"/><rect x="10" y="22" width="180" height="2" fill="#1F1D1A"/><g stroke="#1F1D1A" stroke-width="1.3">${[10, 46, 82, 118, 154].map((x, idx) => `<polygon points="${x + 18},27 ${x + 34},42 ${x + 18},57 ${x + 2},42" fill="${idx % 2 === 0 ? '#A63426' : '#F6EFE4'}"/><circle cx="${x + 18}" cy="42" r="2.2" fill="#1F1D1A"/>`).join('')}</g><rect x="10" y="61" width="180" height="2" fill="#1F1D1A"/><g transform="translate(26,62) scale(0.84)"><path d="M114,44 C122,22 135,10 148,10 C156,10 163,16 168,24 C160,26 153,24 148,22 C142,27 137,39 135,54 Z" fill="#A63426"/><path d="M145,10 L149,2 L152,11" fill="#A63426"/><path d="M118,34 L110,27 M124,25 L116,18 M132,16 L125,10" stroke="#1F1D1A" stroke-width="1.8" stroke-linecap="round"/><path d="M44,54 C62,48 102,48 135,54 C132,74 122,82 104,80 C84,78 68,82 48,79 C38,77 36,64 44,54 Z" fill="#A63426"/><path d="M62,56 L78,76 M78,55 L94,77 M78,55 L62,76 M94,55 L78,77" stroke="#F6EFE4" stroke-width="1.3"/><path d="M44,58 C26,56 14,68 10,86" fill="none" stroke="#1F1D1A" stroke-width="3" stroke-linecap="round"/><g stroke="#1F1D1A" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M52,78 L36,104 L24,122"/><path d="M64,79 L56,104 L46,122"/><path d="M116,78 L134,100 L146,120"/><path d="M126,76 L148,94 L162,110"/></g></g><rect x="10" y="166" width="180" height="2" fill="#1F1D1A"/><g>${[10, 46, 82, 118, 154].map((x, idx) => `<polygon points="${x},184 ${x + 18},168 ${x + 36},184" fill="${idx % 2 === 0 ? '#1F1D1A' : '#A63426'}"/>`).join('')}</g><rect x="10" y="187" width="180" height="4" fill="#A63426"/></svg>`;
    }
    if (id === 'keske') {
        return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="12" y="12" width="176" height="176" fill="none" stroke="#1F1D1A" stroke-width="1.5" stroke-dasharray="4 3"/>${[[32, 32], [168, 32], [32, 168], [168, 168]].map(([cx, cy]) => `<g transform="translate(${cx},${cy})"><rect x="-10" y="-3" width="20" height="6" fill="#A63426"/><rect x="-3" y="-10" width="6" height="20" fill="#A63426"/><rect x="-4" y="-4" width="8" height="8" fill="#B88A44" stroke="#1F1D1A" stroke-width="1"/></g>`).join('')}<g transform="translate(100,100)">${[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => `<g transform="rotate(${deg})"><polygon points="0,-72 13,-34 0,-22 -13,-34" fill="${idx % 2 === 0 ? '#A63426' : '#1F1D1A'}" stroke="#1F1D1A" stroke-width="1.3"/><polygon points="0,-58 6,-36 0,-28 -6,-36" fill="${idx % 2 === 0 ? '#B88A44' : '#A63426'}"/><rect x="-3" y="-79" width="6" height="6" fill="#A63426" transform="rotate(45 0 -76)"/></g>`).join('')}<polygon points="0,-24 24,0 0,24 -24,0" fill="#F6EFE4" stroke="#1F1D1A" stroke-width="2"/><polygon points="0,-16 16,0 0,16 -16,0" fill="#A63426" stroke="#1F1D1A" stroke-width="1.2"/><polygon points="0,-7 7,0 0,7 -7,0" fill="#B88A44"/></g></svg>`;
    }
    if (id === 'tulip') {
        return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="12" y="12" width="176" height="176" fill="none" stroke="#B88A44" stroke-width="1.5"/><g transform="translate(100,104)"><path d="M0,74 V-20" stroke="#2F4A37" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M0,48 C-28,44 -50,24 -52,-4 C-53,-20 -40,-30 -30,-22 M0,48 C28,44 50,24 52,-4 C53,-20 40,-30 30,-22" stroke="#2F4A37" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M0,66 C-22,68 -48,58 -58,38 C-38,38 -18,46 0,60 Z M0,66 C22,68 48,58 58,38 C38,38 18,46 0,60 Z" fill="#2F4A37" stroke="#1F1D1A" stroke-width="1.2"/><path d="M-26,34 C-46,32 -66,18 -64,2 C-52,6 -42,16 -34,26 Z M26,34 C46,32 66,18 64,2 C52,6 42,16 34,26 Z" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.1"/><g transform="translate(-44,-22) rotate(-26)"><path d="M0,12 C-12,8 -14,-8 -8,-16 C-3,-10 0,-4 0,-4 C0,-4 3,-10 8,-16 C14,-8 12,8 0,12 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.2"/></g><g transform="translate(44,-22) rotate(26)"><path d="M0,12 C-12,8 -14,-8 -8,-16 C-3,-10 0,-4 0,-4 C0,-4 3,-10 8,-16 C14,-8 12,8 0,12 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.2"/></g><g transform="translate(0,-34)"><path d="M0,26 C-26,22 -34,-8 -20,-34 C-10,-22 -6,-10 0,-6 C6,-10 10,-22 20,-34 C34,-8 26,22 0,26 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.5"/><path d="M0,20 C-12,6 -12,-22 0,-44 C12,-22 12,6 0,20 Z" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.3"/><path d="M0,8 C-5,-2 -4,-18 0,-28 C4,-18 5,-2 0,8 Z" fill="#FAF6EE"/><path d="M-12,22 Q0,32 12,22 L6,30 L-6,30 Z" fill="#2F4A37"/></g><circle cx="0" cy="-84" r="2.8" fill="#A63426"/><circle cx="-18" cy="-76" r="2.2" fill="#B88A44"/><circle cx="18" cy="-76" r="2.2" fill="#B88A44"/></g></svg>`;
    }
    if (id === 'lyre') {
        return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="12" y="12" width="176" height="176" fill="none" stroke="#1F1D1A" stroke-width="1.4"/><rect x="18" y="18" width="164" height="164" fill="none" stroke="#B88A44" stroke-width="1" stroke-dasharray="2 4"/><g transform="translate(100,102)"><path d="M-46,64 C-32,54 -14,50 0,58 C14,50 32,54 46,64 C30,72 14,72 0,66 C-14,72 -30,72 -46,64 Z" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.4"/><path d="M0,56 C-24,52 -56,34 -60,2 C-64,-28 -44,-60 -18,-56 C-6,-54 -2,-40 -10,-32 C-18,-24 -30,-30 -28,-40 C-38,-36 -44,-14 -38,6 C-32,26 -14,36 0,34 C14,36 32,26 38,6 C44,-14 38,-36 28,-40 C30,-30 18,-24 10,-32 C2,-40 6,-54 18,-56 C44,-60 64,-28 60,2 C56,34 24,52 0,56 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.8" stroke-linejoin="round"/><path d="M0,34 C-14,16 -24,-2 -18,-18 C-12,-28 -2,-22 0,-12 C2,-22 12,-28 18,-18 C24,-2 14,16 0,34 Z" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.4"/><path d="M0,-24 C-10,-38 -12,-58 0,-74 C12,-58 10,-38 0,-24 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.4"/><path d="M0,-34 C-4,-44 -4,-54 0,-64 C4,-54 4,-44 0,-34 Z" fill="#F6EFE4"/><circle cx="0" cy="10" r="4.5" fill="#F6EFE4" stroke="#1F1D1A" stroke-width="1.2"/></g></svg>`;
    }
    if (id === 'altai') {
        return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="12" y="12" width="176" height="176" fill="none" stroke="#1F1D1A" stroke-width="1.5"/><g transform="translate(100,100)"><rect x="-56" y="-56" width="112" height="112" fill="#EAE0D0" stroke="#A63426" stroke-width="2" transform="rotate(45)"/>${[0, 90, 180, 270].map(deg => `<g transform="rotate(${deg})"><path d="M0,-22 C-8,-44 -28,-54 -40,-42 C-48,-34 -42,-20 -30,-22 C-24,-23 -24,-31 -30,-33 M0,-22 C8,-44 28,-54 40,-42 C48,-34 42,-20 30,-22 C24,-23 24,-31 30,-33" fill="none" stroke="#A63426" stroke-width="5.5" stroke-linecap="round"/><path d="M0,-14 V-52" stroke="#1F1D1A" stroke-width="2.2" stroke-linecap="round"/></g>`).join('')}<polygon points="0,-20 20,0 0,20 -20,0" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.6"/><circle cx="0" cy="0" r="6" fill="#2F4A37"/></g></svg>`;
    }
    return `<svg viewBox="0 0 200 200" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F6EFE4"/><rect x="12" y="12" width="176" height="176" fill="none" stroke="#1F1D1A" stroke-width="1.5"/><g transform="translate(100,100)"><polygon points="0,-72 72,0 0,72 -72,0" fill="none" stroke="#A63426" stroke-width="2.5"/><polygon points="0,-54 54,0 0,54 -54,0" fill="#EAE0D0" stroke="#1F1D1A" stroke-width="1.5"/>${[0, 90, 180, 270].map(deg => `<g transform="rotate(${deg})"><path d="M0,-18 C-14,-28 -18,-44 0,-52 C18,-44 14,-28 0,-18 Z" fill="#A63426" stroke="#1F1D1A" stroke-width="1.2"/><path d="M-24,-24 Q-36,-36 -22,-44 M24,-24 Q36,-36 22,-44" fill="none" stroke="#2F4A37" stroke-width="2.4" stroke-linecap="round"/></g>`).join('')}<circle cx="0" cy="0" r="16" fill="#B88A44" stroke="#1F1D1A" stroke-width="1.5"/><circle cx="0" cy="0" r="6" fill="#1F1D1A"/></g></svg>`;
}

function getOrnamentStripSVG() {
    return `<svg viewBox="0 0 1200 20" preserveAspectRatio="xMidYMid slice" class="w-full h-full block" aria-hidden="true"><rect width="1200" height="20" fill="#FAF6EE"/>${Array.from({ length: 40 }, (_, i) => { const x = i * 30; return `<polygon points="${x + 15},2 ${x + 27},10 ${x + 15},18 ${x + 3},10" fill="${i % 2 === 0 ? '#A63426' : '#2F4A37'}" stroke="#1F1D1A" stroke-width="0.8"/><circle cx="${x + 15}" cy="10" r="2.2" fill="#F3ECE1"/>`; }).join('')}</svg>`;
}

/* =========================================================================
   3. АКТУАЛЬНАЯ КАРТА РФ В ПРОЕКЦИИ АЛЬБЕРСА + ЗУМ И ПАНОРАМИРОВАНИЕ
   ========================================================================= */
const ALBERS_CFG = (() => {
    const rad = Math.PI / 180;
    const phi1 = 45 * rad, phi2 = 70 * rad, phi0 = 60 * rad, lam0 = 100 * rad;
    const n = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
    const C = Math.cos(phi1) * Math.cos(phi1) + 2 * n * Math.sin(phi1);
    const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
    return { rad, lam0, n, C, rho0, cx: 520, cy: 345, scale: 610 };
})();

function projectGeo(lon, lat) {
    const { rad, lam0, n, C, rho0, cx, cy, scale } = ALBERS_CFG;
    const rho = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(lat * rad))) / n;
    const theta = n * (lon * rad - lam0);
    return [+(cx + scale * rho * Math.sin(theta)).toFixed(1), +(cy - scale * (rho0 - rho * Math.cos(theta))).toFixed(1)];
}

function geoToPath(pts, close = false) {
    const d = pts.map(([lon, lat], i) => {
        const [x, y] = projectGeo(lon, lat);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    return close ? `${d} Z` : d;
}

function initRussiaMap() {
    const mainland = [
        [30.8, 69.75], [33.1, 69.25], [36.2, 69.1], [41.1, 67], [39.5, 66.1], [36.5, 66.2], [32.6, 67.15], [34.7, 65.8], [35.2, 64.4], [38.1, 63.9], [40.5, 64.55], [39.8, 65.6], [44, 66], [43.4, 67.6], [43.3, 68.65], [44.7, 68], [46.5, 66.8], [48.5, 67.8], [52.8, 68.4], [59.8, 69.7],
        [65, 69.3], [67.2, 68.7], [66.9, 71.1], [70.1, 72.9], [72.8, 72.6], [72.5, 69], [73.6, 67.3], [75.2, 69.2], [74.5, 72.2], [78.5, 72.9], [81, 73.4], [85.5, 73.9], [90.5, 75.5], [98, 76.6], [104.3, 77.72], [107.8, 76.6], [113.5, 74.7], [110.2, 73.7], [116.5, 73.3], [124, 73.6], [128.8, 72.9], [130.5, 71.4], [136.5, 71.4], [141, 72.7], [148.5, 72.2], [155, 70.9], [161.5, 69.7], [168, 69.7], [171.2, 70], [175.5, 68.3], [180, 67.5], [186, 67], [190.35, 66.08],
        [187.8, 64.4], [183.5, 64.9], [178.5, 64.7], [179.1, 63.1], [176.8, 62.2], [172, 60.8], [166, 59.9], [163.5, 59.3], [162.8, 56.5], [161.2, 54.5], [158.9, 52.8], [156.8, 50.87], [155.8, 53.5], [156.9, 57.5], [160.2, 60.5], [164.2, 62.2], [160, 62.1], [155.5, 61.3], [150.8, 59.5], [144.8, 59.3], [140.2, 57.5], [137.5, 54.8], [141.3, 53.3], [141.4, 51.5], [139.8, 48.8], [137.4, 45.8], [135.2, 43.9], [132.9, 42.75], [131.8, 43.1], [130.65, 42.3],
        [131.4, 44.3], [133.5, 45.2], [134.8, 48.4], [131, 47.7], [127.5, 50.2], [124, 53.3], [120.2, 53.3], [117.8, 49.8], [114.5, 50], [108.5, 50.1], [105, 50.3], [100.5, 51.6], [97.5, 50.3], [93, 50.3], [89.5, 49.6], [87.5, 49.1], [83.8, 50.6], [80.2, 51], [77.2, 53.8], [73.5, 53.8], [69.5, 55], [66.2, 55.2], [63, 54.2], [61.2, 52.3], [60.4, 50.8], [56.2, 50.7], [53, 51.3], [49.8, 51], [47.2, 49.6], [46.9, 48.1], [49.1, 46.2], [47.3, 45.1], [47.6, 43], [48.6, 41.8], [47.8, 41.2], [45.8, 42.1], [43.5, 42.7], [41.5, 43.3], [40, 43.4],
        [38.1, 44.6], [36.7, 45.25], [37.6, 45.8], [38.3, 46.7], [39.3, 47.2], [37.6, 47.08], [36.8, 46.75], [35.2, 46.3], [34.9, 45.8], [35.5, 45.3], [36.45, 45.35], [35.3, 44.95], [34.15, 44.45], [33.5, 44.58], [32.5, 45.35], [33.6, 46.05], [32.2, 46.45], [33.6, 46.95], [35.2, 47.7], [36.5, 47.8], [37.8, 48.6], [38.5, 49.6], [37.8, 50.2],
        [36.4, 50.35], [34.3, 51.3], [32.2, 52.1], [31.8, 53], [32.5, 54], [30.7, 55.3], [28.1, 56.2], [27.4, 57.75], [28.1, 59.45], [30.1, 59.95], [28.6, 60.5], [28.2, 61.3], [30.9, 62.6], [29.9, 64.5], [29.6, 66.5], [28.5, 68.5]
    ];
    const kaliningrad = [[19.6, 54.45], [20.5, 54.95], [21.3, 55.25], [22.8, 54.9], [22.7, 54.35], [20.5, 54.35]];
    const islands = [
        [[57, 73.2], [61.5, 74.9], [66.5, 76.4], [68.8, 76.9], [65.2, 75], [60.8, 73.5], [56.2, 72.5]],
        [[53, 70.6], [56.2, 71.2], [57.2, 72.4], [54.2, 72.3], [52.2, 71.4]],
        [[48.5, 80.7], [52, 81.1], [53.2, 80.3], [49.5, 80.1]],
        [[55.5, 81.2], [61.5, 81.4], [62.2, 80.4], [56.2, 80.3]],
        [[95, 79.7], [100, 81], [102.5, 80], [97.5, 78.8]],
        [[101, 78.5], [106.5, 79.3], [106.8, 78.1], [101.8, 77.9]],
        [[137, 75.5], [142, 76.1], [143.5, 74.8], [138, 74.5]],
        [[146.5, 75.3], [150.5, 75.4], [149.8, 74.7], [146.2, 74.8]],
        [[178.6, 71.4], [182.2, 71.4], [182, 70.9], [178.8, 70.9]],
        [[142.4, 54.3], [143.5, 52], [143.3, 49], [143.5, 46.8], [142.1, 45.9], [141.9, 48.2], [142.1, 51.2], [141.6, 53.5]]
    ];
    const kurils = [[156, 50.5], [154.6, 49.4], [153.2, 48.1], [151.8, 47], [150, 45.9], [148.1, 45], [146.1, 44.1], [146.7, 43.8]];
    const fdBorders = [
        [[28.1, 56.2], [33, 57.6], [39, 58.8], [45, 60], [47.5, 60.5]],
        [[47.5, 60.5], [42.6, 57], [42.8, 53.5], [40.5, 50.5]],
        [[38.5, 49.6], [40.5, 50.5], [44.5, 50.8], [47.2, 49.6]],
        [[40, 44], [41.5, 45.2], [44.5, 45.5], [47.3, 45.1]],
        [[58, 61.5], [57.5, 57.5], [59.5, 54.5], [60.4, 50.8]],
        [[65, 69.3], [61, 65], [58, 61.5]],
        [[81, 73.4], [78, 66], [77, 61.5], [75.5, 57.5], [73.5, 53.8]],
        [[113.5, 74.7], [110, 68], [108.5, 60], [108.5, 55], [104.5, 51.7]]
    ];
    const rivers = [
        [[35.9, 56.8], [39.9, 57.6], [44, 56.3], [49.1, 55.8], [50.1, 53.2], [46, 51.5], [44.5, 48.7], [48.2, 46.3]],
        [[83.8, 53.3], [82.9, 55], [73.4, 61.2], [69, 61], [66.6, 66.5], [72, 67.5]],
        [[94.4, 51.7], [92.9, 56], [92.2, 58.5], [88, 65.8], [86.2, 69.4], [82.5, 72.2]],
        [[106, 53.9], [105.8, 56.8], [120.4, 60.4], [129.7, 62], [123.4, 66.8], [127, 72.4]],
        [[121.5, 53.3], [127.5, 50.2], [135, 48.5], [137, 50.5], [140.7, 53.1]]
    ];
    const baikal = [[103.7, 51.7], [105.5, 52.3], [107.6, 53.3], [109.2, 54.8], [109.8, 55.8], [109.1, 55.7], [108.1, 54.3], [106.5, 52.8], [104.8, 51.9]];

    let grat = '';
    [50, 60, 70].forEach(lat => { const p = []; for (let lon = 25; lon <= 190; lon += 5) p.push([lon, lat]); grat += `<path d="${geoToPath(p)}"/>`; });
    [40, 60, 80, 100, 120, 140, 160, 180].forEach(lon => { const p = []; for (let lat = 42; lat <= 78; lat += 4) p.push([lon, lat]); grat += `<path d="${geoToPath(p)}"/>`; });
    document.getElementById('russia-graticule-layer').innerHTML = grat;

    let land = `<path id="russia-mainland" d="${geoToPath(mainland, true)}" fill="url(#russiaLandGrad)" stroke="#2A2622" stroke-width="1.65" stroke-linejoin="round"/>`;
    land += `<path d="${geoToPath(kaliningrad, true)}" fill="url(#russiaLandGrad)" stroke="#2A2622" stroke-width="1.4" stroke-linejoin="round"/>`;
    islands.forEach(p => { land += `<path d="${geoToPath(p, true)}" fill="#DFC9AA" stroke="#2A2622" stroke-width="1.25" stroke-linejoin="round"/>`; });
    kurils.forEach(([lon, lat]) => { const [x, y] = projectGeo(lon, lat); land += `<circle cx="${x}" cy="${y}" r="2.4" fill="#DFC9AA" stroke="#2A2622" stroke-width="1"/>`; });
    document.getElementById('russia-land-layer').innerHTML = land;

    document.getElementById('russia-fd-layer').innerHTML = fdBorders.map(l => `<path d="${geoToPath(l)}"/>`).join('');
    document.getElementById('russia-hydro-layer').innerHTML = `<g fill="none" stroke="#5D7D78" stroke-opacity="0.58" stroke-width="1.5" stroke-linecap="round">${rivers.map(r => `<path d="${geoToPath(r)}"/>`).join('')}</g><path d="${geoToPath(baikal, true)}" fill="#5D7D78" stroke="#2A2622" stroke-width="0.9"/>`;

    const lbls = [
        { t: 'Крым', lon: 34.3, lat: 45.2, s: 7.5, o: 0.65 }, { t: 'Калининград', lon: 21.2, lat: 53.3, s: 7.8, o: 0.65 },
        { t: 'ЦЕНТР', lon: 37.5, lat: 55.6, s: 9, o: 0.42 }, { t: 'УРАЛ', lon: 62.5, lat: 60.5, s: 9, o: 0.42 },
        { t: 'СИБИРЬ', lon: 88, lat: 61.5, s: 9.5, o: 0.42 }, { t: 'ДАЛЬНИЙ ВОСТОК', lon: 136, lat: 61, s: 9.5, o: 0.42 },
        { t: 'оз. Байкал', lon: 112.5, lat: 53.2, s: 8, it: true, c: '#3D5A55', o: 0.85 }
    ];
    document.getElementById('russia-labels-layer').innerHTML = lbls.map(l => {
        const [x, y] = projectGeo(l.lon, l.lat);
        return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${l.s}" font-weight="bold" ${l.it ? 'font-style="italic"' : ''} fill="${l.c || '#1F1D1A'}" fill-opacity="${l.o}" letter-spacing="0.8">${l.t}</text>`;
    }).join('');

    const pins = [
        { id: 'arkhangelsk', label: 'Архангельск', lon: 40.54, lat: 64.54, bx: 12, by: -10, bw: 84 },
        { id: 'chuvashia', label: 'Чувашия', lon: 47.25, lat: 56.14, bx: -82, by: -25, bw: 66, leader: true },
        { id: 'tatarstan', label: 'Татарстан', lon: 49.11, lat: 55.79, bx: 13, by: -6, bw: 72 },
        { id: 'dagestan', label: 'Дагестан', lon: 47.50, lat: 42.98, bx: 12, by: -9, bw: 68 },
        { id: 'altai', label: 'Алтай', lon: 85.96, lat: 51.96, bx: 12, by: -9, bw: 50 },
        { id: 'yakutia', label: 'Якутия', lon: 129.73, lat: 62.03, bx: 12, by: -9, bw: 58 }
    ];
    document.getElementById('russia-pins-layer').innerHTML = pins.map(p => {
        const [x, y] = projectGeo(p.lon, p.lat);
        const line = p.leader ? `<line x1="0" y1="0" x2="${p.bx + p.bw}" y2="${p.by + 10}" stroke="#2A2622" stroke-opacity="0.5" stroke-width="0.9"/>` : '';
        return `<g class="map-pin" data-region="${p.id}" tabindex="0" role="button" aria-label="Выбрать регион: ${p.label}"
            onclick="onPinClick(event,'${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectMapRegion('${p.id}');}"
            transform="translate(${x},${y})">${line}<circle class="pin-ring" cx="0" cy="0" r="9" fill="none" stroke="#A63426" stroke-width="2"/><circle cx="0" cy="0" r="8" fill="#A63426" stroke="#FAF6EE" stroke-width="2.2"/><circle cx="0" cy="0" r="2.5" fill="#FAF6EE"/><rect x="${p.bx}" y="${p.by}" width="${p.bw}" height="19" rx="2" fill="#FAF6EE" fill-opacity="0.94" stroke="#2A2622" stroke-opacity="0.4" stroke-width="0.85"/><text x="${p.bx + 6}" y="${p.by + 13}" font-size="10.2" font-weight="bold" fill="#1F1D1A">${p.label}</text></g>`;
    }).join('');
}

const mapNav = { zoom: 1, minZoom: 1, maxZoom: 2.6, panX: 0, panY: 0, dragging: false, moved: 0, sx: 0, sy: 0, spx: 0, spy: 0 };

function applyRussiaMapTransform() {
    if (mapNav.zoom <= 1) { mapNav.panX = 0; mapNav.panY = 0; }
    else {
        mapNav.panX = Math.min(0, Math.max(920 * (1 - mapNav.zoom), mapNav.panX));
        mapNav.panY = Math.min(0, Math.max(550 * (1 - mapNav.zoom), mapNav.panY));
    }
    const vp = document.getElementById('russia-map-viewport');
    const stage = document.getElementById('russia-map-stage');
    const lbl = document.getElementById('map-zoom-label');
    const hint = document.getElementById('map-pan-hint');
    if (vp) vp.setAttribute('transform', `translate(${mapNav.panX.toFixed(1)},${mapNav.panY.toFixed(1)}) scale(${mapNav.zoom.toFixed(2)})`);
    if (lbl) lbl.textContent = `${Math.round(mapNav.zoom * 100)}%`;
    if (stage) stage.classList.toggle('can-pan', mapNav.zoom > 1);
    if (hint) hint.classList.toggle('hidden', mapNav.zoom <= 1);
}

function zoomRussiaMap(delta, fx = 460, fy = 275) {
    const oldZ = mapNav.zoom;
    const newZ = Math.max(mapNav.minZoom, Math.min(mapNav.maxZoom, +(oldZ + delta).toFixed(2)));
    if (newZ === oldZ) return;
    const r = newZ / oldZ;
    mapNav.panX = fx - (fx - mapNav.panX) * r;
    mapNav.panY = fy - (fy - mapNav.panY) * r;
    mapNav.zoom = newZ;
    applyRussiaMapTransform();
}

function resetRussiaMapTransform() {
    mapNav.zoom = 1; mapNav.panX = 0; mapNav.panY = 0;
    applyRussiaMapTransform();
}

function onPinClick(e, id) {
    if (mapNav.moved > 6) return;
    e.stopPropagation();
    selectMapRegion(id);
}

function setupMapPanEvents() {
    const stage = document.getElementById('russia-map-stage');
    const svg = document.getElementById('russia-map-svg');
    if (!stage || !svg) return;

    stage.addEventListener('pointerdown', (e) => {
        if (mapNav.zoom <= 1) return;
        mapNav.dragging = true; mapNav.moved = 0;
        mapNav.sx = e.clientX; mapNav.sy = e.clientY;
        mapNav.spx = mapNav.panX; mapNav.spy = mapNav.panY;
        stage.classList.add('is-panning');
        if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    stage.addEventListener('pointermove', (e) => {
        if (!mapNav.dragging) return;
        const dx = e.clientX - mapNav.sx, dy = e.clientY - mapNav.sy;
        mapNav.moved = Math.hypot(dx, dy);
        const rect = svg.getBoundingClientRect();
        const k = rect.width > 0 ? 920 / rect.width : 1;
        mapNav.panX = mapNav.spx + dx * k;
        mapNav.panY = mapNav.spy + dy * k;
        applyRussiaMapTransform();
    });
    const endPan = () => {
        if (!mapNav.dragging) return;
        mapNav.dragging = false;
        stage.classList.remove('is-panning');
        setTimeout(() => { mapNav.moved = 0; }, 50);
    };
    stage.addEventListener('pointerup', endPan);
    stage.addEventListener('pointercancel', endPan);
    stage.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && mapNav.zoom <= 1) return;
        e.preventDefault();
        const r = svg.getBoundingClientRect();
        zoomRussiaMap(e.deltaY < 0 ? 0.25 : -0.25, ((e.clientX - r.left) / r.width) * 920, ((e.clientY - r.top) / r.height) * 550);
    }, { passive: false });
    stage.addEventListener('dblclick', (e) => {
        if (e.target.closest('.map-pin')) return;
        const r = svg.getBoundingClientRect();
        if (mapNav.zoom > 1.2) resetRussiaMapTransform();
        else zoomRussiaMap(0.6, ((e.clientX - r.left) / r.width) * 920, ((e.clientY - r.top) / r.height) * 550);
    });
}

/* =========================================================================
   4. ДАННЫЕ ПЛАТФОРМЫ И ДЕМО-ПУБЛИКАЦИИ БЛОГА
   ========================================================================= */
const ORNAMENTS = [
    { id: 'mezen', name: 'Мезенская роспись', shortName: 'Мезень', region: 'Архангельская область · Русский Север', origin: 'Низовья реки Мезень (село Палащелье), XIX век', palette: ['Киноварь (#A63426)', 'Угольная сажа (#1F1D1A)', 'Охристый фон (#F6EFE4)'], brief: 'Архаичные бегущие кони и солярные решётки — символы восхода солнца, плодородия и движения времени.', history: 'Мезенская (палащельская) роспись — один из древнейших графических промыслов Русского Севера. Мастера расписывали прялки, туеса и короба палочкой-тиской и глухариным пером всего двумя красками: красной охрой и сажей.', symbolism: 'Красный конь олицетворяет солнце и добрую весть, горизонтальные решётки обозначают вспаханную землю, а ряды ромбов с точками — засеянное поле и достаток в доме.' },
    { id: 'keske', name: 'Чувашское «Кеске»', shortName: 'Кеске', region: 'Чувашская Республика · Поволжье', origin: 'Традиционная счётная вышивка на домотканом холсте', palette: ['Мареновый красный (#A63426)', 'Угольный чёрный (#1F1D1A)', 'Золотистая охра (#B88A44)'], brief: 'Строгая геометрическая восьмиконечная розетка — нагрудный оберег солнца, согласия и рода.', history: 'Кĕскĕ — парные нагрудные узоры традиционной чувашской женской рубахи. Вышивка выполнялась по счёту нитей без предварительного рисунка, требуя математической точности и симметрии.', symbolism: 'Восьмилучевая звезда символизирует солнце и восемь сторон света, гармонию Вселенной и защиту семьи. Чёрный контур очерчивает границы гармонии, а красный наполняет орнамент жизненной силой.' },
    { id: 'tulip', name: 'Татарский «Тюльпан» (Кашкар)', shortName: 'Тюльпан', region: 'Республика Татарстан · Поволжье', origin: 'Золотное шитьё, кожаная мозаика (ичиги) и резьба', palette: ['Карминно-красный (#A63426)', 'Лесной зелёный (#2F4A37)', 'Золотая нить (#B88A44)'], brief: 'Симметричный растительный мотив тюльпана — символ весеннего возрождения, чистоты и процветания.', history: 'Тюльпан (лалә) занимает центральное место в татарском декоративно-прикладном искусстве: от узорных сапожек-ичигов до калфаков и архитектурного декора.', symbolism: 'В культуре народов Поволжья тюльпан означает обновление жизни, благополучие, уважение к корням и расцвет творческой энергии молодёжи.' },
    { id: 'lyre', name: 'Якутская «Лира» (Көҕүөр ойуу)', shortName: 'Лира', region: 'Республика Саха (Якутия) · Дальний Восток', origin: 'Резьба по дереву, бересте и серебряная чеканка', palette: ['Охристо-красный (#A63426)', 'Тёплое золото (#B88A44)', 'Графит (#1F1D1A)'], brief: 'Лировидный побег «көҕүөр ойуу» — знак изобилия, непрерывности жизни и связи человека с природой.', history: 'Лировидный орнамент «көҕүөр ойуу» украшал праздничную посуду для кумыса (чороны), берестяные сосуды и национальные украшения.', symbolism: 'Расходящиеся ростки-завитки напоминают распускающийся лист и рога священного животного, символизируя плодородие, мир и преемственность поколений.' }
];

const MAP_REGIONS = {
    arkhangelsk: { id: 'arkhangelsk', name: 'Архангельская область', district: 'Северо-Западный ФО', ornamentId: 'mezen', ornamentTitle: 'Мезенская роспись', culture: 'Край деревянного зодчества, поморских традиций, северного пения и архаичной графической росписи по дереву.', facts: ['Центр промысла — деревня Палащелье на реке Мезень', 'Традиционные цвета: красная охра и угольная сажа', 'Более 200 лет непрерывной художественной школы'] },
    chuvashia:   { id: 'chuvashia', name: 'Чувашская Республика', district: 'Приволжский ФО', ornamentId: 'keske', ornamentTitle: 'Чувашское «Кеске»', culture: '«Край ста тысяч вышивок и ста тысяч песен», где геометрический орнамент служил полноценным языком символов.', facts: ['В традиционной вышивке насчитывается свыше 30 видов швов', 'Орнамент «Кеске» обладает строгой восьмиосевой симметрией', 'День чувашской вышивки отмечается ежегодно 26 ноября'] },
    tatarstan:   { id: 'tatarstan', name: 'Республика Татарстан', district: 'Приволжский ФО', ornamentId: 'tulip', ornamentTitle: 'Татарский «Тюльпан» (Кашкар)', culture: 'Перекрёсток культур Волжской Булгарии и Поволжья, знаменитый кожаной мозаикой, золотным шитьём и фольклором.', facts: ['Техника кожаной мозаики «каюлы күн» не имеет аналогов в мире', 'Мотив тюльпана объединяет растительный мир и архитектуру', 'Нижнекамск и Казань — центры молодёжных этнофорумов'] },
    dagestan:    { id: 'dagestan', name: 'Республика Дагестан', district: 'Северо-Кавказский ФО', ornamentId: 'dagestan', ornamentTitle: 'Кайтагский солярный орнамент', culture: 'Многонациональная республика, объединяющая более 30 коренных народов, знаменитая балхарской керамикой и кайтагской вышивкой.', facts: ['Кайтагская вышивка шёлком хранит древние солярные знаки', 'Аул Балхар известен тонкостенной расписной керамикой', 'Каждое ущелье бережно хранит свой язык и ремесло'] },
    altai:       { id: 'altai', name: 'Республика Алтай', district: 'Сибирский ФО', ornamentId: 'altai', ornamentTitle: 'Алтайский узор «Кочкор муйус»', culture: 'Горный край древних петроглифов, горлового пения кай, войлочной мозаики «шырдак» и глубокого почтения к природе.', facts: ['Мотив «Кочкор муйус» (завитки рогов) символизирует достаток и силу', 'Традиционные ковры сшиваются из цветного овечьего войлока', 'Алтайские орнаменты имеют зеркальную четырёхосевую симметрию'] },
    yakutia:     { id: 'yakutia', name: 'Республика Саха (Якутия)', district: 'Дальневосточный ФО', ornamentId: 'lyre', ornamentTitle: 'Якутская «Лира» (Көҕүөр ойуу)', culture: 'Земля героического эпоса Олонхо (шедевр ЮНЕСКО), праздника встречи лета Ысыах и тонкого ювелирного мастерства.', facts: ['Узор «Көҕүөр ойуу» украшает кубки-чороны и берестяную утварь', 'Симметричные завитки обозначают расцвет природы после зимы', 'Традиции резьбы бережно переосмысляются молодыми дизайнерами'] }
};

const EVENTS = [
    { id: 'evt-mezen', title: 'Мастер-класс: Мезенская роспись', format: 'Офлайн', topic: 'Роспись', date: '18 ноября 2026', time: '15:00 – 18:30', location: 'г. Нижнекамск · Молодёжный центр культуры', ornamentId: 'mezen', shortDesc: 'Практическое занятие по созданию деревянной открытки-оберега в каноне архаичной северной росписи с разбором символики.', fullDesc: 'На мастер-классе мы шаг за шагом разберём композицию мезенской росписи: от построения геометрической сетки до рисования тонконогих красных и чёрных коней. Все материалы предоставляются организаторами.', program: [{ time: '15:00', title: 'Открытие и вводная лекция', desc: 'История села Палащелье и значение солярных символов Русского Севера.' }, { time: '15:40', title: 'Постановка руки и графический ритм', desc: 'Отработка тонких штрихов и геометрических поясов на крафтовой бумаге.' }, { time: '16:30', title: 'Создание авторской работы', desc: 'Роспись деревянного панно с мотивом бегущих коней под руководством мастера.' }, { time: '18:00', title: 'Чаепитие и мини-выставка', desc: 'Обсуждение работ, обмен контактами и фотосессия участников.' }], speakers: [{ name: 'Анна Морозова', role: 'Художник-этнограф, мастер росписи по дереву', initials: 'АМ', color: '#A63426' }, { name: 'Дмитрий Крюков', role: 'Куратор проекта «Культурный мост»', initials: 'ДК', color: '#2F4A37' }, { name: 'Алина Сафина', role: 'Арт-директор, исследователь этнографики', initials: 'АС', color: '#B88A44' }] },
    { id: 'evt-keske', title: 'Воркшоп по чувашской вышивке «Кеске»', format: 'Офлайн', topic: 'Вышивка', date: '21 ноября 2026', time: '14:00 – 17:00', location: 'г. Казань · Дом дружбы народов', ornamentId: 'keske', shortDesc: 'Знакомство с математикой счётного шва и создание современной текстильной нашивки с восьмиконечной звездой «Кеске».', fullDesc: 'Чувашский орнамент «Кеске» строится по строгим законам геометрии. На воркшопе участники научатся читать схемы традиционной вышивки и перенесут узор на льняную нашивку.', program: [{ time: '14:00', title: 'Язык геометрической вышивки', desc: 'Почему в чувашской вышивке нет узелков и как читаются солярные знаки.' }, { time: '14:45', title: 'Разметка на льняной канве', desc: 'Счёт нитей, выбор красной и чёрной нити, построение центра розетки.' }, { time: '15:30', title: 'Практика счётного шва', desc: 'Вышивка мини-розетки «Кеске» с индивидуальным сопровождением.' }, { time: '16:40', title: 'Итоги и вручение штампов', desc: 'Оформление нашивки и общение участников.' }], speakers: [{ name: 'Елена Иванова', role: 'Мастер народных художественных промыслов', initials: 'ЕИ', color: '#A63426' }, { name: 'Игорь Петров', role: 'Исследователь культуры Поволжья', initials: 'ИП', color: '#2F4A37' }] },
    { id: 'evt-lang', title: 'Разговорный клуб: языки Поволжья', format: 'Онлайн', topic: 'Языки', date: '24 ноября 2026', time: '19:00 – 20:30 (МСК)', location: 'Онлайн · Видеокомната «Культурный мост»', ornamentId: 'tulip', shortDesc: 'Живая встреча для молодёжи: базовые фразы на татарском, чувашском и удмуртском языках, пословицы и этно-квиз.', fullDesc: 'Уютная онлайн-встреча без скучных учебников! Носители языков Поволжья поделятся красивыми выражениями о дружбе и природе и проведут командный квиз.', program: [{ time: '19:00', title: 'Знакомство на разных языках', desc: 'Учимся приветствовать друг друга и представлять свой регион.' }, { time: '19:25', title: 'Словарь живого общения', desc: '15 тёплых фраз для путешествий и дружбы на языках Поволжья.' }, { time: '19:55', title: 'Командный этно-квиз', desc: 'Угадываем значение редких слов и происхождение народных песен.' }, { time: '20:20', title: 'Открытый микрофон', desc: 'Обмен идеями для следующей встречи разговорного клуба.' }], speakers: [{ name: 'Тимур Галимов', role: 'Преподаватель татарского языка и блогер', initials: 'ТГ', color: '#2F4A37' }, { name: 'Надежда Васильева', role: 'Активист молодёжного клуба языков', initials: 'НВ', color: '#B88A44' }] },
    { id: 'evt-lyre', title: 'Лекция: Якутская «Лира» в современном дизайне', format: 'Онлайн', topic: 'Фольклор', date: '27 ноября 2026', time: '18:00 – 19:30 (МСК)', location: 'Онлайн · Прямой эфир с разбором кейсов', ornamentId: 'lyre', shortDesc: 'Как бережно интегрировать северный орнамент «Көҕүөр ойуу» в веб-интерфейсы, графический дизайн и современную одежду.', fullDesc: 'Открытая лекция для UI/UX-дизайнеров, иллюстраторов и всех, кто интересуется этнической эстетикой. Разберём каноны якутской «Лиры» и кейсы оцифровки узоров.', program: [{ time: '18:00', title: 'Анатомия узора «Көҕүөр ойуу»', desc: 'История лировидного мотива в культуре народа Саха.' }, { time: '18:35', title: 'От бересты к векторной сетке', desc: 'Как сохранить пластику линии при работе в Figma и SVG.' }, { time: '19:05', title: 'Разбор работ и сессия вопросов', desc: 'Рекомендации экспертов для участников дизайн-хакатонов.' }], speakers: [{ name: 'Айаал Николаев', role: 'Графический дизайнер из Якутска', initials: 'АН', color: '#A63426' }, { name: 'Мария Лебедева', role: 'Арт-директор музейных цифровых проектов', initials: 'МЛ', color: '#2F4A37' }] }
];

const MEDIA_ITEMS = [
    { id: 'media-podcast', type: 'Подкаст', duration: '18:40', title: 'Голоса Русского Севера', desc: 'Беседа с хранителями мезенской росписи и фольклористами о том, как древние символы обретают вторую жизнь в молодёжных проектах.', ornamentId: 'mezen' },
    { id: 'media-article', type: 'Статья', duration: '6 мин чтения', title: 'Символика восьмиконечной звезды «Кеске»', desc: 'Разбираем геометрический код чувашской вышивки: почему каждый стежок подчиняется строгой симметрии и что означает цвет нити.', ornamentId: 'keske', articleBody: [
        'В традиционной культуре народов Поволжья орнамент никогда не был случайным украшением. Чувашская вышивка «Кеске» — пример того, как геометрия ткани становилась письмом, понятным каждому жителю селения.',
        'Восьмиконечная розетка располагалась на груди праздничной рубахи симметрично с двух сторон. Она символизировала небесное светило, оберегающее сердце человека, и гармонию восьми направлений мира.',
        'Особое значение придавалось палитре: глубокий мареновый красный олицетворял жизнь, энергию и тепло; чёрный контур удерживал композицию и защищал границы узора; золотистая охра добавляла сияние солнца.',
        'Сегодня дизайнеры и исследователи бережно переносят геометрическую точность «Кеске» в цифровые продукты, создавая визуальный мост между вековой традицией и современной молодёжной культурой.'
    ] },
    { id: 'media-video', type: 'Короткое видео', duration: '03:15', title: 'Как рождается мезенский конь', desc: 'Пошаговая визуальная зарисовка: от красной охристой полосы и тонких штрихов пером до готового фриза бегущих коней.', ornamentId: 'mezen' }
];

const UIKIT_COLORS = [
    { name: 'Неотбелённый лён', role: 'Основной фон страниц', hex: '#F3ECE1', textDark: true },
    { name: 'Архивный крафт', role: 'Вторичные секции и плашки', hex: '#EAE0D0', textDark: true },
    { name: 'Угольная тушь', role: 'Заголовки, текст и линии сетки', hex: '#1F1D1A', textDark: false },
    { name: 'Киноварь / Охра', role: 'Этнические акценты и маркеры', hex: '#A63426', textDark: false },
    { name: 'Лесной зелёный', role: 'Основные кнопки (Primary CTA)', hex: '#2F4A37', textDark: false },
    { name: 'Льняное золото', role: 'Достижения и тёплые детали', hex: '#B88A44', textDark: true }
];

const DEFAULT_BLOG_POSTS = [
    {
        id: 'demo-post-1',
        type: 'text',
        title: 'Как узоры Поволжья вдохновляют молодых дизайнеров',
        category: 'Поволжье · Этнодизайн',
        body: 'Традиционные орнаменты — не музейная пыль, а живой визуальный код. В этой заметке рассказываем, как студенты НХТИ объединяют каноны татарского тюльпана и чувашского «Кеске» в современных плакатах и интерфейсах.\n\nВы можете добавить собственный текстовый пост, видео со звуком или аудиозапись прямо с Google Диска через Панель администратора!',
        cover_url: '',
        media_url: '',
        is_pinned: true,
        created_at: '2026-11-20T12:00:00.000Z'
    }
];

const ALL_INTERESTS = ['Роспись', 'Вышивка', 'Языки', 'Фольклор', 'Путешествия'];
const STORAGE_KEY = 'km_ethnocraft_state_v2';
const USERS_DB_KEY = 'km_users_db_v1';
const USER_SESSION_KEY = 'km_current_user_email_v1';
const BLOG_STORAGE_KEY = 'km_blog_posts_v2';
const mediaBlobCache = {};
/* =========================================================================
   5. ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ФАЙЛОВ (INDEXEDDB) ДЛЯ РЕЖИМА БЕЗ SUPABASE
   ========================================================================= */
function idbOpen() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('IndexedDB недоступен'));
        const req = indexedDB.open('km_media_db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbSaveFile(key, file) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(file, key);
        tx.oncomplete = () => resolve(`idb://${key}`);
        tx.onerror = () => reject(tx.error);
    });
}

async function idbLoadBlobUrl(idbUrl) {
    if (!idbUrl || !idbUrl.startsWith('idb://')) return idbUrl;
    if (mediaBlobCache[idbUrl]) return mediaBlobCache[idbUrl];
    const key = idbUrl.replace('idb://', '');
    try {
        const db = await idbOpen();
        const file = await new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readonly');
            const req = tx.objectStore('files').get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        if (file) {
            mediaBlobCache[idbUrl] = URL.createObjectURL(file);
            return mediaBlobCache[idbUrl];
        }
    } catch (_) {}
    return '';
}

async function hydrateBlogBlobs() {
    const tasks = [];
    state.blogPosts.forEach(p => {
        if (p.cover_url && p.cover_url.startsWith('idb://')) tasks.push(idbLoadBlobUrl(p.cover_url));
        if (p.media_url && p.media_url.startsWith('idb://')) tasks.push(idbLoadBlobUrl(p.media_url));
    });
    if (tasks.length) await Promise.all(tasks);
}

/* =========================================================================
   6. СОСТОЯНИЕ ПРИЛОЖЕНИЯ И СОХРАНЕНИЕ ПРОГРЕССА
   ========================================================================= */
const DEFAULT_PERSISTED = {
    registeredEvents: ['evt-lang'],
    collectedOrnaments: ['mezen', 'keske'],
    savedMedia: ['media-article'],
    savedEvents: ['evt-mezen'],
    userInterests: ['Роспись', 'Вышивка', 'Фольклор'],
    subInterests: ['Роспись', 'Фольклор']
};

const state = {
    currentView: 'home', viewportMode: 'desktop', selectedRegion: 'arkhangelsk',
    selectedEventId: 'evt-mezen', filterFormat: 'Все', filterTopic: 'Все темы',
    registeredEvents: [...DEFAULT_PERSISTED.registeredEvents],
    collectedOrnaments: [...DEFAULT_PERSISTED.collectedOrnaments],
    savedMedia: [...DEFAULT_PERSISTED.savedMedia],
    savedEvents: [...DEFAULT_PERSISTED.savedEvents],
    userInterests: [...DEFAULT_PERSISTED.userInterests],
    subInterests: [...DEFAULT_PERSISTED.subInterests],
    podcastPlaying: false, podcastSeconds: 84, podcastTotal: 1120, podcastTimer: null,
    videoPlaying: false, videoProgress: 24, videoTimer: null,
    blogPosts: [...DEFAULT_BLOG_POSTS],
    blogFilter: 'all',
    adminSession: null,
    adminTab: 'editor',
    adminPostType: 'text',
    pendingCoverFile: null,
    pendingVideoFile: null,
    pendingAudioFile: null,
    previewBlobCover: '',
    previewBlobMedia: '',
    currentUser: null,
    userProfile: {
        email: '', lastname: '', firstname: '', middlename: '',
        org: '', birthdate: '', phone: ''
    }
};

function loadPersistedState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        ['registeredEvents', 'collectedOrnaments', 'savedMedia', 'savedEvents', 'userInterests', 'subInterests'].forEach(k => {
            if (Array.isArray(p[k])) state[k] = p[k];
        });
        if (p.currentUser && typeof p.currentUser === 'object') state.currentUser = p.currentUser;
        if (p.userProfile && typeof p.userProfile === 'object') state.userProfile = { ...state.userProfile, ...p.userProfile };
    } catch (_) {}
}

function savePersistedState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            registeredEvents: state.registeredEvents,
            collectedOrnaments: state.collectedOrnaments,
            savedMedia: state.savedMedia,
            savedEvents: state.savedEvents,
            userInterests: state.userInterests,
            subInterests: state.subInterests,
            currentUser: state.currentUser,
            userProfile: state.userProfile
        }));
    } catch (_) {}
}

function resetSavedState() {
    Object.keys(DEFAULT_PERSISTED).forEach(k => { state[k] = [...DEFAULT_PERSISTED[k]]; });
    savePersistedState();
    renderSubInterests();
    syncAllUI();
    showToast('Прогресс сброшен к исходному состоянию');
}

/* =========================================================================
   7. ОБЛАЧНАЯ И ЛОКАЛЬНАЯ ЛОГИКА БЛОГА + ПАНЕЛЬ АДМИНИСТРАТОРА
   ========================================================================= */
const SUPABASE_SQL_SNIPPET = `-- 1. Таблица публикаций (текст, видео, аудио)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text', 'video', 'audio')),
  title text not null,
  category text not null,
  body text not null,
  cover_url text default '',
  media_url text default '',
  is_pinned boolean default false,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;
create policy "Public read posts" on public.posts for select using (true);
create policy "Admin write posts" on public.posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. Бакет Storage для фото, видео и аудиофайлов
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects for select
  using (bucket_id = 'media');
create policy "Admin upload media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "Admin delete media" on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');`;

function enhanceAdminFormForAudio() {
    const textBtn = document.getElementById('type-btn-text');
    const videoBtn = document.getElementById('type-btn-video');
    const videoFields = document.getElementById('admin-video-fields');
    if (!textBtn || !videoBtn || !videoFields || document.getElementById('type-btn-audio')) return;

    const btnWrap = textBtn.parentElement;
    btnWrap.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2.5';

    const audioBtn = document.createElement('button');
    audioBtn.type = 'button';
    audioBtn.id = 'type-btn-audio';
    audioBtn.onclick = () => setAdminPostType('audio');
    audioBtn.className = 'py-3 px-3 rounded-md border hairline-strong bg-linen text-ink text-sm font-bold cursor-pointer transition';
    audioBtn.textContent = '🎙 Аудио-пост';
    btnWrap.appendChild(audioBtn);

    const gdCoverHint = document.createElement('p');
    gdCoverHint.className = 'text-[11px] text-ink/65';
    gdCoverHint.textContent = 'Поддерживаются прямые ссылки и обычные ссылки Google Диска (с открытым доступом).';
    document.getElementById('post-cover-url')?.parentElement?.parentElement?.appendChild(gdCoverHint);

    const gdVideoHint = document.createElement('p');
    gdVideoHint.className = 'text-[11px] text-ink/70';
    gdVideoHint.textContent = 'Можно вставить обычную ссылку с Google Диска («Копировать ссылку»), YouTube, VK Видео, Rutube или загрузить файл с ПК.';
    videoFields.appendChild(gdVideoHint);

    const audioFields = document.createElement('div');
    audioFields.id = 'admin-audio-fields';
    audioFields.className = 'hidden p-4 bg-craft border hairline-strong rounded-sm space-y-3';
    audioFields.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs uppercase tracking-wider font-bold text-cinnabar">Аудиофайл или ссылка с Google Диска</span>
            <span class="text-[11px] text-ink/65">Google Диск, MP3, OGG, WAV</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-2.5">
            <input id="post-audio-url" type="url" placeholder="Ссылка Google Диска (drive.google.com/...) или .mp3" oninput="updateAdminPreview()" class="flex-1 px-3 py-2 rounded-md bg-parchment border hairline-strong text-xs focus:outline-none focus:ring-2 focus:ring-forest">
            <label class="px-4 py-2 rounded-md bg-ink text-parchment hover:bg-ink/85 text-xs font-bold cursor-pointer text-center shrink-0">
                Выбрать аудио с ПК
                <input id="post-audio-file" type="file" accept="audio/*" class="hidden" onchange="handleAudioFileSelect(event)">
            </label>
        </div>
        <div id="selected-audio-filename" class="hidden text-xs font-bold text-forest"></div>
        <p class="text-[11px] text-ink/70">Для Google Диска включите «Все, у кого есть ссылка» → скопируйте и вставьте ссылку сюда.</p>
    `;
    videoFields.insertAdjacentElement('afterend', audioFields);

    const sqlBox = document.getElementById('supabase-sql-box');
    if (sqlBox) sqlBox.textContent = SUPABASE_SQL_SNIPPET;
}

async function loadBlogPosts() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                state.blogPosts = data.map(row => ({
                    ...row,
                    media_url: row.media_url || row.video_url || ''
                }));
                renderBlogPosts();
                if (state.currentView === 'admin') renderAdminPostsList();
                return;
            }
        } catch (_) {}
    }

    try {
        const raw = localStorage.getItem(BLOG_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) state.blogPosts = parsed;
        }
    } catch (_) {}
    await hydrateBlogBlobs();
    renderBlogPosts();
    if (state.currentView === 'admin') renderAdminPostsList();
}

function saveLocalBlogPosts() {
    try {
        localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(state.blogPosts));
    } catch (_) {}
}

function renderBlogPosts() {
    const filters = [
        { id: 'all', label: 'Все материалы' },
        { id: 'text', label: 'Текстовые посты' },
        { id: 'video', label: 'Видео со звуком' },
        { id: 'audio', label: 'Аудио / Подкасты' }
    ];

    const fGroup = document.getElementById('blog-filter-group');
    if (fGroup) {
        fGroup.innerHTML = filters.map(f => {
            const active = state.blogFilter === f.id;
            return `<button type="button" onclick="setBlogFilter('${f.id}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${active ? 'bg-cinnabar text-parchment border border-cinnabar' : 'bg-linen text-ink border hairline-strong hover:bg-craft'}">${f.label}</button>`;
        }).join('');
    }

    const q = (document.getElementById('blog-search-input')?.value || '').trim().toLowerCase();
    const sorted = [...state.blogPosts].sort((a, b) => (Number(b.is_pinned) - Number(a.is_pinned)) || (new Date(b.created_at) - new Date(a.created_at)));
    const filtered = sorted.filter(p => {
        const matchType = state.blogFilter === 'all' || p.type === state.blogFilter;
        const matchQ = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
        return matchType && matchQ;
    });

    const lbl = document.getElementById('blog-counter-label');
    if (lbl) lbl.textContent = `Показано: ${filtered.length}`;

    const banner = document.getElementById('blog-status-banner');
    if (banner) {
        banner.classList.remove('hidden');
        banner.innerHTML = supabaseClient
            ? `<span>Облачный режим <strong>Supabase</strong> активен — публикации синхронизируются для всех посетителей.</span><span class="font-bold text-forest">● Онлайн</span>`
            : `<span>Режим <strong>локальной публикации + Google Диск</strong>. Чтобы загруженные с ПК файлы видели все посетители, подключите Supabase в админ-панели.</span><button type="button" onclick="openAdminEntry()" class="font-bold text-cinnabar underline cursor-pointer shrink-0">Настроить →</button>`;
    }

    const grid = document.getElementById('blog-posts-grid');
    if (!grid) return;
    if (!filtered.length) {
        grid.innerHTML = `<div class="col-span-full bg-parchment border hairline rounded-sm p-10 text-center space-y-3"><div class="font-serif font-bold text-2xl text-ink">Публикаций пока нет</div><p class="text-sm text-ink/70">Добавьте первый текстовый пост, видео со звуком или аудиозапись через Панель администратора.</p><button type="button" onclick="openAdminEntry()" class="px-5 py-2.5 rounded-md bg-forest text-parchment text-sm font-bold cursor-pointer">+ Добавить материал</button></div>`;
        return;
    }

    grid.innerHTML = filtered.map(post => {
        const typeLabel = post.type === 'video' ? '🎬 Видео со звуком' : post.type === 'audio' ? '🎙 Аудио-пост' : '📝 Статья';
        const dateStr = new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        const coverSrc = resolveCoverUrl(post.cover_url);
        const coverHtml = coverSrc ? `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="this.style.display='none'" class="w-full h-52 object-cover rounded-sm border hairline mb-4">` : '';
        const mediaHtml = post.type === 'video'
            ? `<div class="mb-4">${renderVideoPlayerHTML(post.media_url, post.cover_url)}</div>`
            : post.type === 'audio'
                ? `<div class="mb-4">${renderAudioPlayerHTML(post.media_url)}</div>`
                : '';

        const shortBody = post.body.length > 260 ? `${post.body.slice(0, 260).trim()}...` : post.body;
        return `
        <article class="bg-parchment border hairline-strong rounded-sm flex flex-col justify-between overflow-hidden">
            <div class="p-5 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2.5 py-1 rounded-sm bg-craft border hairline text-xs font-bold text-cinnabar">${typeLabel}</span>
                        <span class="px-2.5 py-1 rounded-sm bg-linen border hairline text-xs font-bold text-ink/80">${escapeHtml(post.category)}</span>
                        ${post.is_pinned ? `<span class="px-2 py-1 rounded-sm bg-forest text-parchment text-[11px] font-bold">Закреплено</span>` : ''}
                    </div>
                    <span class="text-xs text-ink/55">${escapeHtml(dateStr)}</span>
                </div>
                <h2 class="font-serif font-bold text-2xl sm:text-3xl text-ink leading-tight mb-3">${escapeHtml(post.title)}</h2>
                ${post.type === 'text' ? coverHtml : ''}
                ${mediaHtml}
                <p class="post-prose text-sm text-ink/80 leading-relaxed">${escapeHtml(shortBody)}</p>
            </div>
            <div class="px-5 py-3.5 bg-linen/70 border-t hairline flex items-center justify-between gap-3">
                <button type="button" onclick="openBlogPostModal('${escapeHtml(post.id)}')" class="text-xs sm:text-sm font-bold text-forest hover:text-cinnabar underline underline-offset-4 cursor-pointer">Открыть полностью →</button>
                ${state.adminSession ? `<button type="button" onclick="editAdminPost('${escapeHtml(post.id)}')" class="text-xs font-bold text-ink/70 hover:text-cinnabar cursor-pointer">Редактировать</button>` : ''}
            </div>
        </article>`;
    }).join('');
}

function setBlogFilter(f) {
    state.blogFilter = f;
    renderBlogPosts();
}

function openBlogPostModal(postId) {
    const p = state.blogPosts.find(x => x.id === postId);
    if (!p) return;
    const dateStr = new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const coverSrc = resolveCoverUrl(p.cover_url);
    document.getElementById('detail-modal-eyebrow').textContent = `${p.category} · ${dateStr}`;
    document.getElementById('detail-modal-title').textContent = p.title;
    document.getElementById('detail-modal-body').innerHTML = `
        ${p.type === 'video' ? renderVideoPlayerHTML(p.media_url, p.cover_url) : ''}
        ${p.type === 'audio' ? renderAudioPlayerHTML(p.media_url) : ''}
        ${p.type === 'text' && coverSrc ? `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(p.title)}" onerror="this.style.display='none'" class="w-full max-h-72 object-cover rounded-sm border hairline">` : ''}
        <div class="post-prose text-sm sm:text-base text-ink/85 leading-relaxed">${escapeHtml(p.body)}</div>
        <div class="pt-4 border-t hairline flex justify-end"><button type="button" onclick="closeModal('modal-detail')" class="px-5 py-2.5 rounded-md border hairline-strong text-sm font-bold hover:bg-craft cursor-pointer">Закрыть</button></div>
    `;
    document.getElementById('modal-detail').classList.remove('hidden');
}

const LOCAL_ADMIN_EMAIL = '';        // Оставьте '', чтобы входить с любым Email
const LOCAL_ADMIN_PASSWORD = '12345'; // <-- ВПИШИТЕ СЮДА СВОЙ ПАРОЛЬ

function openAdminEntry() {
    if (state.adminSession) {
        switchView('admin');
        renderAdminView();
        return;
    }
    const hint = document.getElementById('admin-login-hint');
    const demoWrap = document.getElementById('admin-demo-entry-wrap');
    document.getElementById('admin-login-error').classList.add('hidden');
    document.getElementById('admin-password').value = '';

    if (demoWrap) demoWrap.classList.add('hidden');

    if (supabaseClient) {
        hint.textContent = 'Введите Email и пароль администратора (Supabase Auth).';
    } else {
        hint.textContent = 'Введите пароль администратора для доступа к панели управления.';
    }
    document.getElementById('modal-admin-login').classList.remove('hidden');
}

async function submitAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const err = document.getElementById('admin-login-error');

    if (supabaseClient) {
        if (!email || !password) {
            err.textContent = 'Введите Email и пароль администратора.';
            err.classList.remove('hidden');
            return;
        }
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
            err.textContent = 'Неверный Email или пароль администратора.';
            err.classList.remove('hidden');
            return;
        }
        state.adminSession = { mode: 'cloud', email: data.user.email };
        closeModal('modal-admin-login');
        updateAdminHeaderBadge();
        switchView('admin');
        renderAdminView();
        showToast('Вход в панель администратора выполнен');
        return;
    }

    const emailMatches = !LOCAL_ADMIN_EMAIL || email.toLowerCase() === LOCAL_ADMIN_EMAIL.toLowerCase();
    const passwordMatches = password === LOCAL_ADMIN_PASSWORD;

    if (!emailMatches || !passwordMatches) {
        err.textContent = 'Неверный пароль!';
        err.classList.remove('hidden');
        return;
    }

    err.classList.add('hidden');
    enterLocalAdminMode(email || 'Администратор');
}

function enterLocalAdminMode(email = 'Администратор') {
    state.adminSession = { mode: 'local', email };
    closeModal('modal-admin-login');
    updateAdminHeaderBadge();
    switchView('admin');
    renderAdminView();
    showToast('Вход в панель администратора выполнен');
}

function enterLocalAdminMode(label = 'Локальный редактор') {
    state.adminSession = { mode: 'local', email: label };
    closeModal('modal-admin-login');
    updateAdminHeaderBadge();
    switchView('admin');
    renderAdminView();
    showToast('Открыт локальный режим администратора');
}

async function logoutAdmin() {
    if (supabaseClient) {
        try { await supabaseClient.auth.signOut(); } catch (_) {}
    }
    state.adminSession = null;
    updateAdminHeaderBadge();
    switchView('blog');
    showToast('Вы вышли из панели администратора');
}

function updateAdminHeaderBadge() {
    const lbl = document.getElementById('header-admin-label');
    if (lbl) lbl.textContent = state.adminSession ? 'Админ ✓' : 'Админ';
}

function renderAdminView() {
    const statusEl = document.getElementById('admin-connection-status');
    if (statusEl) {
        statusEl.textContent = state.adminSession?.mode === 'cloud'
            ? `Облако Supabase подключено · Редактор: ${state.adminSession.email}`
            : 'Локальный режим · Посты сохраняются в браузере (ссылки Google Диска, YouTube, VK, Rutube работают сразу)';
    }
    const countEl = document.getElementById('admin-posts-count');
    if (countEl) countEl.textContent = state.blogPosts.length;
    switchAdminTab(state.adminTab);
    setAdminPostType(state.adminPostType);
    renderAdminPostsList();
    updateAdminPreview();
}

function switchAdminTab(tab) {
    state.adminTab = tab;
    document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`admin-tab-${tab}`)?.classList.remove('hidden');
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        const active = btn.dataset.adminTab === tab;
        btn.className = active
            ? 'admin-tab-btn px-4 py-2 rounded-md text-sm font-bold bg-forest text-parchment cursor-pointer'
            : 'admin-tab-btn px-4 py-2 rounded-md text-sm font-bold border hairline-strong bg-parchment text-ink cursor-pointer';
    });
}

function setAdminPostType(type) {
    state.adminPostType = type;
    const map = {
        text: document.getElementById('type-btn-text'),
        video: document.getElementById('type-btn-video'),
        audio: document.getElementById('type-btn-audio')
    };
    Object.entries(map).forEach(([k, el]) => {
        if (!el) return;
        el.className = k === type
            ? 'py-3 px-3 rounded-md border hairline-strong bg-forest text-parchment text-sm font-bold cursor-pointer transition'
            : 'py-3 px-3 rounded-md border hairline-strong bg-linen text-ink text-sm font-bold cursor-pointer transition';
    });
    document.getElementById('admin-video-fields')?.classList.toggle('hidden', type !== 'video');
    document.getElementById('admin-audio-fields')?.classList.toggle('hidden', type !== 'audio');
    updateAdminPreview();
}

function handleCoverFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    state.pendingCoverFile = file;
    if (state.previewBlobCover) URL.revokeObjectURL(state.previewBlobCover);
    state.previewBlobCover = URL.createObjectURL(file);
    updateAdminPreview();
}

function handleVideoFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    state.pendingVideoFile = file;
    if (state.previewBlobMedia) URL.revokeObjectURL(state.previewBlobMedia);
    state.previewBlobMedia = URL.createObjectURL(file);
    const lbl = document.getElementById('selected-video-filename');
    if (lbl) { lbl.textContent = `Выбран файл: ${file.name} (${(file.size / 1048576).toFixed(1)} МБ)`; lbl.classList.remove('hidden'); }
    updateAdminPreview();
}

function handleAudioFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    state.pendingAudioFile = file;
    if (state.previewBlobMedia) URL.revokeObjectURL(state.previewBlobMedia);
    state.previewBlobMedia = URL.createObjectURL(file);
    const lbl = document.getElementById('selected-audio-filename');
    if (lbl) { lbl.textContent = `Выбран аудиофайл: ${file.name} (${(file.size / 1048576).toFixed(1)} МБ)`; lbl.classList.remove('hidden'); }
    updateAdminPreview();
}

function updateAdminPreview() {
    const box = document.getElementById('admin-live-preview');
    if (!box) return;
    const title = document.getElementById('post-title')?.value.trim() || 'Заголовок публикации';
    const cat = document.getElementById('post-category')?.value.trim() || 'Регион · Тема';
    const body = document.getElementById('post-body')?.value.trim() || 'Здесь появится текст вашей статьи или описание материала...';
    const coverInput = document.getElementById('post-cover-url')?.value.trim() || '';
    const coverSrc = state.previewBlobCover || resolveCoverUrl(coverInput);

    let mediaHtml = '';
    if (state.adminPostType === 'video') {
        const vUrl = state.previewBlobMedia || document.getElementById('post-video-url')?.value.trim() || '';
        mediaHtml = vUrl ? renderVideoPlayerHTML(vUrl, coverSrc) : `<div class="p-6 text-center text-xs text-ink/60 bg-craft border hairline rounded-sm">Вставьте ссылку (Google Диск / YouTube / VK / MP4) или выберите видеофайл для проверки звука</div>`;
    } else if (state.adminPostType === 'audio') {
        const aUrl = state.previewBlobMedia || document.getElementById('post-audio-url')?.value.trim() || '';
        mediaHtml = aUrl ? renderAudioPlayerHTML(aUrl) : `<div class="p-4 text-center text-xs text-ink/60 bg-craft border hairline rounded-sm">Вставьте ссылку с Google Диска / .mp3 или выберите аудиофайл для прослушивания</div>`;
    } else if (coverSrc) {
        mediaHtml = `<img src="${escapeHtml(coverSrc)}" alt="" onerror="this.style.display='none'" class="w-full h-44 object-cover rounded-sm border hairline">`;
    }

    const typeBadge = state.adminPostType === 'video' ? '🎬 Видео со звуком' : state.adminPostType === 'audio' ? '🎙 Аудио-пост' : '📝 Статья';
    box.innerHTML = `
        <div class="flex flex-wrap items-center gap-2"><span class="px-2 py-0.5 bg-craft border hairline text-[11px] font-bold text-cinnabar rounded-sm">${typeBadge}</span><span class="px-2 py-0.5 bg-parchment border hairline text-[11px] font-bold">${escapeHtml(cat)}</span></div>
        <h3 class="font-serif font-bold text-2xl text-ink leading-tight">${escapeHtml(title)}</h3>
        ${mediaHtml}
        <p class="post-prose text-xs sm:text-sm text-ink/80 leading-relaxed">${escapeHtml(body)}</p>
    `;
}

['post-title', 'post-category', 'post-body'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateAdminPreview);
});

async function uploadMediaFile(file, prefix) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    if (supabaseClient && state.adminSession?.mode === 'cloud') {
        const { error } = await supabaseClient.storage.from(SUPABASE_BUCKET).upload(key, file, { upsert: false });
        if (error) throw error;
        const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
        return data.publicUrl;
    }
    return idbSaveFile(key, file);
}

async function handleAdminPostSubmit(e) {
    e.preventDefault();
    const err = document.getElementById('admin-form-error');
    const editId = document.getElementById('admin-edit-id').value;
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value.trim() || 'Культурный мост';
    const body = document.getElementById('post-body').value.trim();
    const pinned = document.getElementById('post-pinned').checked;
    let coverUrl = document.getElementById('post-cover-url').value.trim();
    let mediaUrl = state.adminPostType === 'video'
        ? (document.getElementById('post-video-url')?.value.trim() || '')
        : state.adminPostType === 'audio'
            ? (document.getElementById('post-audio-url')?.value.trim() || '')
            : '';

    if (!title || !body) {
        err.textContent = 'Заполните заголовок и текст публикации.';
        err.classList.remove('hidden'); return;
    }
    if (state.adminPostType === 'video' && !mediaUrl && !state.pendingVideoFile) {
        err.textContent = 'Укажите ссылку на видео (Google Диск / YouTube / VK / MP4) или выберите видеофайл с ПК.';
        err.classList.remove('hidden'); return;
    }
    if (state.adminPostType === 'audio' && !mediaUrl && !state.pendingAudioFile) {
        err.textContent = 'Укажите ссылку на аудио (Google Диск / MP3) или выберите аудиофайл с ПК.';
        err.classList.remove('hidden'); return;
    }
    err.classList.add('hidden');

    const pWrap = document.getElementById('upload-progress-wrap');
    const pBar = document.getElementById('upload-progress-bar');
    const pLbl = document.getElementById('upload-progress-label');
    const submitBtn = document.getElementById('admin-submit-btn');
    submitBtn.disabled = true;

    try {
        if (state.pendingCoverFile) {
            pWrap?.classList.remove('hidden');
            if (pBar) pBar.style.width = '30%';
            if (pLbl) pLbl.textContent = 'Сохранение обложки...';
            coverUrl = await uploadMediaFile(state.pendingCoverFile, 'cover');
        }
        if (state.adminPostType === 'video' && state.pendingVideoFile) {
            pWrap?.classList.remove('hidden');
            if (pBar) pBar.style.width = '65%';
            if (pLbl) pLbl.textContent = 'Загрузка видеофайла...';
            mediaUrl = await uploadMediaFile(state.pendingVideoFile, 'video');
        }
        if (state.adminPostType === 'audio' && state.pendingAudioFile) {
            pWrap?.classList.remove('hidden');
            if (pBar) pBar.style.width = '65%';
            if (pLbl) pLbl.textContent = 'Загрузка аудиофайла...';
            mediaUrl = await uploadMediaFile(state.pendingAudioFile, 'audio');
        }

        const payload = { type: state.adminPostType, title, category, body, cover_url: coverUrl, media_url: mediaUrl, is_pinned: pinned };

        if (supabaseClient && state.adminSession?.mode === 'cloud') {
            if (pBar) pBar.style.width = '90%';
            if (pLbl) pLbl.textContent = 'Публикация в базе Supabase...';
            if (editId) {
                const { error } = await supabaseClient.from('posts').update(payload).eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('posts').insert([payload]);
                if (error) throw error;
            }
            await loadBlogPosts();
        } else {
            if (editId) {
                const idx = state.blogPosts.findIndex(x => x.id === editId);
                if (idx !== -1) state.blogPosts[idx] = { ...state.blogPosts[idx], ...payload };
            } else {
                state.blogPosts.unshift({ id: `local_${Date.now()}`, ...payload, created_at: new Date().toISOString() });
            }
            saveLocalBlogPosts();
            await hydrateBlogBlobs();
        }

        resetAdminForm();
        renderAdminView();
        renderBlogPosts();
        showToast(editId ? 'Публикация обновлена!' : 'Материал опубликован на сайте!');
    } catch (ex) {
        err.textContent = `Не удалось сохранить: ${ex.message || ex}`;
        err.classList.remove('hidden');
    } finally {
        pWrap?.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function resetAdminForm() {
    document.getElementById('admin-edit-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = 'Татарстан · Традиции';
    document.getElementById('post-body').value = '';
    document.getElementById('post-cover-url').value = '';
    document.getElementById('post-cover-file').value = '';
    if (document.getElementById('post-video-url')) document.getElementById('post-video-url').value = '';
    if (document.getElementById('post-video-file')) document.getElementById('post-video-file').value = '';
    if (document.getElementById('post-audio-url')) document.getElementById('post-audio-url').value = '';
    if (document.getElementById('post-audio-file')) document.getElementById('post-audio-file').value = '';
    document.getElementById('post-pinned').checked = false;
    document.getElementById('selected-video-filename')?.classList.add('hidden');
    document.getElementById('selected-audio-filename')?.classList.add('hidden');
    document.getElementById('admin-form-title').textContent = 'Новая публикация';
    document.getElementById('admin-submit-btn').textContent = 'Опубликовать на сайте';
    document.getElementById('admin-cancel-edit-btn').classList.add('hidden');
    document.getElementById('admin-form-error').classList.add('hidden');
    state.pendingCoverFile = null; state.pendingVideoFile = null; state.pendingAudioFile = null;
    state.previewBlobCover = ''; state.previewBlobMedia = '';
    setAdminPostType('text');
}

function editAdminPost(id) {
    const p = state.blogPosts.find(x => x.id === id);
    if (!p) return;
    if (!state.adminSession) { openAdminEntry(); return; }
    switchView('admin');
    switchAdminTab('editor');
    setAdminPostType(p.type);
    document.getElementById('admin-edit-id').value = p.id;
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-category').value = p.category;
    document.getElementById('post-body').value = p.body;
    document.getElementById('post-cover-url').value = p.cover_url || '';
    if (p.type === 'video' && document.getElementById('post-video-url')) document.getElementById('post-video-url').value = p.media_url || '';
    if (p.type === 'audio' && document.getElementById('post-audio-url')) document.getElementById('post-audio-url').value = p.media_url || '';
    document.getElementById('post-pinned').checked = !!p.is_pinned;
    document.getElementById('admin-form-title').textContent = 'Редактирование публикации';
    document.getElementById('admin-submit-btn').textContent = 'Сохранить изменения';
    document.getElementById('admin-cancel-edit-btn').classList.remove('hidden');
    updateAdminPreview();
}

async function deleteAdminPost(id) {
    if (supabaseClient && state.adminSession?.mode === 'cloud') {
        const { error } = await supabaseClient.from('posts').delete().eq('id', id);
        if (error) { showToast(`Ошибка удаления: ${error.message}`); return; }
        await loadBlogPosts();
    } else {
        state.blogPosts = state.blogPosts.filter(x => x.id !== id);
        saveLocalBlogPosts();
    }
    renderAdminView();
    renderBlogPosts();
    showToast('Публикация удалена');
}

function renderAdminPostsList() {
    const el = document.getElementById('admin-posts-list');
    if (!el) return;
    if (!state.blogPosts.length) {
        el.innerHTML = `<p class="text-sm text-ink/65">Публикаций пока нет.</p>`;
        return;
    }
    el.innerHTML = state.blogPosts.map(p => {
        const icon = p.type === 'video' ? '🎬' : p.type === 'audio' ? '🎙' : '📝';
        return `<div class="p-4 bg-linen border hairline rounded-sm flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-cinnabar">${icon} ${escapeHtml(p.category)} ${p.is_pinned ? '· Закреплено' : ''}</div>
                <div class="font-serif font-bold text-xl text-ink truncate">${escapeHtml(p.title)}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button type="button" onclick="editAdminPost('${escapeHtml(p.id)}')" class="px-3 py-1.5 rounded-md border hairline-strong bg-parchment hover:bg-craft text-xs font-bold cursor-pointer">Изменить</button>
                <button type="button" onclick="deleteAdminPost('${escapeHtml(p.id)}')" class="px-3 py-1.5 rounded-md text-xs font-bold text-cinnabar hover:bg-cinnabar/10 cursor-pointer">Удалить</button>
            </div>
        </div>`;
    }).join('');
}

/* =========================================================================
   8. НАВИГАЦИЯ И РЕНДЕР ОСТАЛЬНЫХ ЭКРАНОВ
   ========================================================================= */
function updateHeaderOffset() {
    const header = document.getElementById('main-header');
    const toolbar = document.getElementById('jury-toolbar');
    if (!header) return;
    if (document.body.classList.contains('mobile-preview-mode') || !toolbar) { header.style.top = '0px'; return; }
    const rect = toolbar.getBoundingClientRect();
    const visible = window.getComputedStyle(toolbar).display !== 'none' && rect.height > 0;
    header.style.top = visible ? `${Math.ceil(rect.height)}px` : '0px';
}

function switchView(viewName, updateHash = true) {
    if (!['home', 'blog', 'admin', 'atlas', 'event', 'profile', 'uikit'].includes(viewName)) viewName = 'home';
    if (viewName === 'admin' && !state.adminSession) { openAdminEntry(); return; }
    state.currentView = viewName;
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${viewName}`)?.classList.remove('hidden');
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === viewName));
    if (viewName === 'blog') renderBlogPosts();
    if (viewName === 'admin') renderAdminView();
    if (viewName === 'atlas') renderFullAtlas();
    if (viewName === 'event') renderEventDetail();
    if (viewName === 'profile') renderProfile();
    if (viewName === 'uikit') renderUIKit();
    if (updateHash) { try { history.replaceState(null, '', `#${viewName}`); } catch (_) {} }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const shell = document.getElementById('app-shell');
    if (shell && document.body.classList.contains('mobile-preview-mode')) shell.scrollTo({ top: 0, behavior: 'smooth' });
}

function setViewportMode(mode) {
    state.viewportMode = mode;
    const body = document.body, btnD = document.getElementById('btn-mode-desktop'), btnM = document.getElementById('btn-mode-mobile');
    if (mode === 'mobile') {
        body.classList.add('mobile-preview-mode');
        btnM.className = 'px-3 py-1 rounded border border-linen/40 bg-linen text-ink font-bold transition cursor-pointer whitespace-nowrap';
        btnD.className = 'px-3 py-1 rounded border border-linen/30 text-linen/85 hover:bg-linen/10 transition cursor-pointer whitespace-nowrap';
        showToast('Включён предпросмотр мобильной версии (375 px)');
    } else {
        body.classList.remove('mobile-preview-mode');
        btnD.className = 'px-3 py-1 rounded border border-linen/40 bg-linen text-ink font-bold transition cursor-pointer whitespace-nowrap';
        btnM.className = 'px-3 py-1 rounded border border-linen/30 text-linen/85 hover:bg-linen/10 transition cursor-pointer whitespace-nowrap';
        toggleMobileMenu(false);
        showToast('Включён предпросмотр десктопной версии (1440 px)');
    }
    updateHeaderOffset();
}

function toggleMobileMenu(forceState) {
    const menu = document.getElementById('mobile-menu'), btn = document.getElementById('mobile-menu-btn');
    const io = document.getElementById('menu-icon-open'), ic = document.getElementById('menu-icon-close');
    const hide = typeof forceState === 'boolean' ? !forceState : !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', hide);
    io.classList.toggle('hidden', !hide);
    ic.classList.toggle('hidden', hide);
    if (btn) btn.setAttribute('aria-expanded', String(!hide));
}

function scrollToCommunity() {
    if (state.currentView !== 'home') {
        switchView('home');
        setTimeout(() => document.getElementById('section-community').scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
        document.getElementById('section-community').scrollIntoView({ behavior: 'smooth' });
    }
}

function selectMapRegion(regionKey) {
    state.selectedRegion = regionKey;
    const r = MAP_REGIONS[regionKey]; if (!r) return;
    document.querySelectorAll('.map-pin').forEach(p => p.classList.toggle('active-pin', p.dataset.region === regionKey));
    document.getElementById('map-quick-buttons').innerHTML = Object.values(MAP_REGIONS).map(reg => {
        const a = reg.id === regionKey;
        return `<button type="button" onclick="selectMapRegion('${reg.id}')" class="px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer ${a ? 'bg-cinnabar text-parchment border border-cinnabar' : 'bg-parchment text-ink border hairline hover:border-ink'}">${reg.name.replace('Республика ', '').replace(' область', '')}</button>`;
    }).join('');
    const isColl = ORNAMENTS.some(o => o.id === r.ornamentId), collected = state.collectedOrnaments.includes(r.ornamentId);
    document.getElementById('map-info-panel').innerHTML = `
        <div>
            <div class="flex items-center justify-between gap-2 mb-3"><span class="px-2.5 py-0.5 bg-craft border hairline text-[11px] uppercase tracking-widest font-bold text-ink/75 rounded-sm">${r.district}</span><span class="text-xs text-cinnabar font-bold">Регион экспозиции</span></div>
            <h3 class="font-serif font-bold text-3xl text-ink leading-tight mb-2">${r.name}</h3>
            <p class="text-sm text-ink/80 leading-relaxed mb-5">${r.culture}</p>
            <div class="flex items-center gap-4 p-3.5 bg-linen border hairline rounded-sm mb-5">
                <div class="w-20 h-20 shrink-0 border hairline bg-parchment overflow-hidden rounded-sm">${getOrnamentTileSVG(r.ornamentId)}</div>
                <div><div class="text-[11px] uppercase tracking-wider text-ink/60 font-bold">Традиционный узор</div><div class="font-serif font-bold text-xl text-ink leading-snug">${r.ornamentTitle}</div>${isColl ? `<button type="button" onclick="openOrnamentModal('${r.ornamentId}')" class="text-xs font-bold text-forest hover:text-cinnabar underline underline-offset-4 mt-1 cursor-pointer">Подробнее о символике →</button>` : `<div class="text-xs text-ink/65 mt-1">Гостевой экспонат карты традиций</div>`}</div>
            </div>
            <ul class="space-y-2 mb-6">${r.facts.map(f => `<li class="flex items-start gap-2 text-xs sm:text-sm text-ink/80"><span class="text-cinnabar font-bold mt-0.5">◆</span><span>${f}</span></li>`).join('')}</ul>
        </div>
        <div class="pt-4 border-t hairline flex flex-wrap gap-2.5">${isColl ? `<button type="button" onclick="toggleCollectOrnament('${r.ornamentId}')" class="flex-1 px-4 py-3 rounded-md text-sm font-bold transition cursor-pointer ${collected ? 'bg-forest/15 border border-forest text-forest hover:bg-forest/20' : 'bg-forest hover:bg-forestHover text-parchment shadow-sm'}">${collected ? '✓ Узор уже в вашей коллекции' : '+ Добавить узор в коллекцию'}</button>` : `<button type="button" onclick="switchView('atlas')" class="flex-1 px-4 py-3 rounded-md bg-forest hover:bg-forestHover text-parchment text-sm font-bold transition cursor-pointer">Открыть Атлас орнаментов</button>`}</div>`;
}

function renderHomeAtlas() {
    document.getElementById('home-atlas-grid').innerHTML = ORNAMENTS.map(o => {
        const c = state.collectedOrnaments.includes(o.id);
        return `<article class="bg-parchment border hairline-strong rounded-sm flex flex-col overflow-hidden hover:shadow-md transition">
            <div class="p-4 bg-linen border-b hairline relative"><div class="aspect-square max-w-[180px] mx-auto border hairline bg-parchment overflow-hidden rounded-sm">${getOrnamentTileSVG(o.id)}</div>${c ? `<span class="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-forest text-parchment text-[11px] font-bold shadow-sm">✓ В коллекции</span>` : ''}</div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div><div class="text-[11px] uppercase tracking-wider text-cinnabar font-bold mb-1">${o.region.split('·')[0].trim()}</div><h3 class="font-serif font-bold text-2xl text-ink leading-tight mb-2">${o.name}</h3><p class="text-xs sm:text-sm text-ink/75 leading-relaxed mb-4">${o.brief}</p></div>
                <div class="flex items-center gap-2 pt-3 border-t hairline"><button type="button" onclick="openOrnamentModal('${o.id}')" class="flex-1 py-2.5 px-3 rounded-md border border-ink hover:bg-craft text-xs sm:text-sm font-bold transition cursor-pointer">Изучить узор</button><button type="button" onclick="toggleCollectOrnament('${o.id}')" class="p-2.5 rounded-md border transition cursor-pointer ${c ? 'bg-forest text-parchment border-forest' : 'bg-linen text-ink border-ink/30 hover:border-ink'}">${c ? '✓' : '+'}</button></div>
            </div>
        </article>`;
    }).join('');
}

function renderFullAtlas() {
    const b = document.getElementById('atlas-progress-badge');
    if (b) b.textContent = `Собрано ${state.collectedOrnaments.length} из ${ORNAMENTS.length}`;
    document.getElementById('full-atlas-list').innerHTML = ORNAMENTS.map((o, i) => {
        const c = state.collectedOrnaments.includes(o.id);
        return `<article class="bg-parchment border hairline-strong rounded-sm overflow-hidden"><div class="responsive-grid-12 grid grid-cols-1 lg:grid-cols-12">
            <div class="responsive-col-span lg:col-span-4 craft-texture p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r hairline"><div class="w-full max-w-[230px] aspect-square border hairline-strong bg-parchment p-2 rounded-sm shadow-sm">${getOrnamentTileSVG(o.id)}</div><div class="mt-3 text-xs text-ink/60 font-bold uppercase tracking-widest">Экспонат №0${i + 1}</div></div>
            <div class="responsive-col-span lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2"><span class="text-xs uppercase tracking-widest font-bold text-cinnabar">${o.region}</span><span class="text-xs px-2.5 py-0.5 rounded-sm border hairline bg-linen text-ink/75">${o.origin}</span></div>
                    <h2 class="font-serif font-bold text-3xl sm:text-4xl text-ink mb-4">${o.name}</h2>
                    <div class="responsive-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5"><div><div class="text-xs uppercase tracking-wider font-bold text-ink/60 mb-1">Историческая справка</div><p class="text-sm text-ink/85 leading-relaxed">${o.history}</p></div><div><div class="text-xs uppercase tracking-wider font-bold text-ink/60 mb-1">Символика и смысл</div><p class="text-sm text-ink/85 leading-relaxed">${o.symbolism}</p></div></div>
                    <div class="flex flex-wrap items-center gap-2 mb-6"><span class="text-xs font-bold text-ink/65 mr-1">Каноническая палитра:</span>${o.palette.map(p => `<span class="px-2.5 py-1 text-xs rounded-sm bg-linen border hairline">${p}</span>`).join('')}</div>
                </div>
                <div class="pt-4 border-t hairline flex flex-wrap items-center gap-3"><button type="button" onclick="toggleCollectOrnament('${o.id}')" class="px-5 py-2.5 rounded-md text-sm font-bold transition cursor-pointer ${c ? 'bg-forest/15 border border-forest text-forest hover:bg-forest/20' : 'bg-forest hover:bg-forestHover text-parchment'}">${c ? '✓ Узор в личной коллекции' : '+ Добавить штамп в коллекцию'}</button><button type="button" onclick="openRelatedEvent('${o.id}')" class="px-5 py-2.5 rounded-md border border-ink hover:bg-craft text-sm font-bold transition cursor-pointer">Событие по этому мотиву →</button></div>
            </div>
        </div></article>`;
    }).join('');
}

function openRelatedEvent(ornamentId) { openEventPage((EVENTS.find(e => e.ornamentId === ornamentId) || EVENTS[0]).id); }

function renderEventFilters() {
    document.getElementById('filter-format-group').innerHTML = ['Все', 'Онлайн', 'Офлайн'].map(f => `<button type="button" onclick="setEventFilter('format','${f}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${state.filterFormat === f ? 'bg-cinnabar text-parchment border border-cinnabar' : 'bg-linen text-ink border hairline-strong hover:bg-craft'}">${f}</button>`).join('');
    document.getElementById('filter-topic-group').innerHTML = ['Все темы', 'Роспись', 'Вышивка', 'Языки', 'Фольклор'].map(t => `<button type="button" onclick="setEventFilter('topic','${t}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${state.filterTopic === t ? 'bg-forest text-parchment border border-forest' : 'bg-linen text-ink border hairline-strong hover:bg-craft'}">${t}</button>`).join('');
}

function setEventFilter(type, value) { if (type === 'format') state.filterFormat = value; if (type === 'topic') state.filterTopic = value; renderEventFilters(); renderEventsGrid(); }

function renderEventsGrid() {
    const filtered = EVENTS.filter(ev => (state.filterFormat === 'Все' || ev.format === state.filterFormat) && (state.filterTopic === 'Все темы' || ev.topic === state.filterTopic));
    const cw = filtered.length === 1 ? 'событие' : (filtered.length >= 2 && filtered.length <= 4 ? 'события' : 'событий');
    document.getElementById('events-counter-label').textContent = `Найдено: ${filtered.length} ${cw}`;
    const grid = document.getElementById('events-grid');
    if (!filtered.length) {
        grid.innerHTML = `<div class="col-span-full bg-parchment border hairline rounded-sm p-10 text-center space-y-3"><div class="font-serif font-bold text-2xl text-ink">По выбранным фильтрам событий пока нет</div><button type="button" onclick="setEventFilter('format','Все');setEventFilter('topic','Все темы')" class="px-5 py-2.5 rounded-md bg-forest text-parchment text-sm font-bold cursor-pointer">Показать все события</button></div>`;
        return;
    }
    grid.innerHTML = filtered.map(ev => {
        const bm = state.savedEvents.includes(ev.id), reg = state.registeredEvents.includes(ev.id);
        return `<article class="bg-parchment border hairline-strong rounded-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition">
            <div>
                <div class="p-4 sm:p-5 bg-craft border-b hairline flex items-center justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-2"><span class="px-2.5 py-1 rounded-sm text-xs font-bold ${ev.format === 'Офлайн' ? 'bg-forest text-parchment' : 'bg-gold/30 text-ink border border-gold'}">${ev.format}</span><span class="px-2.5 py-1 rounded-sm bg-parchment border hairline text-xs font-bold text-ink">${ev.topic}</span>${reg ? `<span class="px-2.5 py-1 rounded-sm bg-cinnabar/15 text-cinnabar border border-cinnabar/30 text-xs font-bold">✓ Вы записаны</span>` : ''}</div>
                    <button type="button" onclick="toggleSaveEvent('${ev.id}')" class="w-9 h-9 rounded-sm border flex items-center justify-center transition cursor-pointer shrink-0 ${bm ? 'bg-cinnabar text-parchment border-cinnabar' : 'bg-parchment text-ink border-ink/30 hover:border-ink'}" aria-label="Сохранить событие"><svg class="w-4 h-4" fill="${bm ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg></button>
                </div>
                <div class="p-5 flex gap-4"><div class="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border hairline bg-linen rounded-sm overflow-hidden">${getOrnamentTileSVG(ev.ornamentId)}</div><div><div class="text-xs font-bold text-cinnabar mb-1">${ev.date} · ${ev.time}</div><h3 class="font-serif font-bold text-2xl text-ink leading-tight mb-2">${ev.title}</h3><p class="text-xs sm:text-sm text-ink/75 leading-relaxed">${ev.shortDesc}</p></div></div>
            </div>
            <div class="px-5 py-4 bg-linen/70 border-t hairline flex flex-wrap items-center justify-between gap-3"><div class="text-xs text-ink/70 flex items-center gap-1.5"><span class="text-cinnabar">●</span><span>${ev.location}</span></div><button type="button" onclick="openEventPage('${ev.id}')" class="px-4 py-2 rounded-md bg-forest hover:bg-forestHover text-parchment text-xs sm:text-sm font-bold transition cursor-pointer">Подробнее и запись →</button></div>
        </article>`;
    }).join('');
}

function formatSeconds(sec) { return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }

function renderMediaGrid() {
    document.getElementById('media-grid').innerHTML = MEDIA_ITEMS.map(item => {
        const saved = state.savedMedia.includes(item.id);
        let block = '';
        if (item.id === 'media-podcast') {
            const pct = Math.min(100, (state.podcastSeconds / state.podcastTotal) * 100);
            block = `<div class="mt-4 p-3.5 bg-linen border hairline rounded-sm"><div class="flex items-center gap-3"><button type="button" onclick="togglePodcastPlay()" class="w-10 h-10 rounded-full bg-forest hover:bg-forestHover text-parchment flex items-center justify-center shrink-0 transition cursor-pointer" aria-label="Воспроизвести">${state.podcastPlaying ? `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>` : `<svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>`}</button><div class="flex-1 min-w-0"><div class="flex items-center justify-between text-[11px] font-bold text-ink/75 mb-1"><span>${state.podcastPlaying ? 'Воспроизведение...' : 'Выпуск №4 · Аудио'}</span><span id="podcast-time-label">${formatSeconds(state.podcastSeconds)} / ${item.duration}</span></div><div class="w-full h-2 bg-craft rounded-full overflow-hidden cursor-pointer border hairline" onclick="seekPodcast(event)"><div id="podcast-progress-bar" class="h-full bg-cinnabar transition-all duration-300" style="width:${pct}%"></div></div></div></div></div>`;
        } else if (item.id === 'media-article') {
            block = `<div class="mt-4"><button type="button" onclick="openArticleModal('${item.id}')" class="w-full py-2.5 px-4 rounded-md border border-ink hover:bg-craft text-sm font-bold transition cursor-pointer">Читать статью →</button></div>`;
        } else {
            block = `<div class="mt-4"><button type="button" onclick="openVideoModal('${item.id}')" class="w-full py-2.5 px-4 rounded-md bg-ink hover:bg-ink/85 text-parchment text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"><span>▶</span><span>Смотреть видео (${item.duration})</span></button></div>`;
        }
        return `<article class="bg-parchment border hairline-strong rounded-sm p-5 flex flex-col justify-between"><div><div class="flex items-center justify-between gap-2 mb-4"><span class="px-2.5 py-1 rounded-sm bg-craft border hairline text-xs font-bold text-cinnabar uppercase tracking-wider">${item.type} · ${item.duration}</span><button type="button" onclick="toggleSaveMedia('${item.id}')" class="px-2.5 py-1 rounded-sm border text-xs font-bold transition cursor-pointer ${saved ? 'bg-cinnabar text-parchment border-cinnabar' : 'bg-linen text-ink border-ink/30 hover:border-ink'}">${saved ? '✓ Сохранено' : 'Сохранить'}</button></div><div class="flex items-start gap-3.5 mb-3"><div class="w-14 h-14 shrink-0 border hairline bg-linen rounded-sm overflow-hidden">${getOrnamentTileSVG(item.ornamentId)}</div><h3 class="font-serif font-bold text-2xl text-ink leading-tight">${item.title}</h3></div><p class="text-sm text-ink/75 leading-relaxed">${item.desc}</p></div>${block}</article>`;
    }).join('');
}

function togglePodcastPlay() {
    state.podcastPlaying = !state.podcastPlaying;
    if (state.podcastPlaying) {
        if (state.podcastTimer) clearInterval(state.podcastTimer);
        state.podcastTimer = setInterval(() => {
            state.podcastSeconds = (state.podcastSeconds + 1) % state.podcastTotal;
            const b = document.getElementById('podcast-progress-bar'), l = document.getElementById('podcast-time-label');
            if (b) b.style.width = `${(state.podcastSeconds / state.podcastTotal) * 100}%`;
            if (l) l.textContent = `${formatSeconds(state.podcastSeconds)} / 18:40`;
        }, 1000);
    } else clearInterval(state.podcastTimer);
    renderMediaGrid();
}

function seekPodcast(e) {
    const r = e.currentTarget.getBoundingClientRect();
    state.podcastSeconds = Math.floor(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * state.podcastTotal);
    renderMediaGrid();
}

function renderSubInterests() {
    document.getElementById('sub-interests-group').innerHTML = ['Роспись', 'Вышивка', 'Языки', 'Фольклор', 'Экспедиции'].map(tag => {
        const s = state.subInterests.includes(tag);
        return `<button type="button" onclick="toggleSubInterest('${tag}')" class="px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${s ? 'bg-cinnabar text-parchment border border-cinnabar' : 'bg-linen text-ink border hairline-strong hover:bg-craft'}">${s ? '✓ ' : ''}${tag}</button>`;
    }).join('');
}

function toggleSubInterest(tag) { state.subInterests = state.subInterests.includes(tag) ? state.subInterests.filter(t => t !== tag) : [...state.subInterests, tag]; savePersistedState(); renderSubInterests(); }

function handleCommunitySubmit(e) {
    e.preventDefault();
    const inp = document.getElementById('sub-email'), err = document.getElementById('sub-error'), email = inp.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Пожалуйста, введите корректный адрес электронной почты.'; err.classList.remove('hidden'); inp.focus(); return; }
    err.classList.add('hidden');
    document.getElementById('community-form').classList.add('hidden');
    document.getElementById('community-success-text').textContent = `Мы отправили приветственное письмо на ${email}. Выбранные темы: ${state.subInterests.length ? state.subInterests.join(', ') : 'все направления'}.`;
    document.getElementById('community-success').classList.remove('hidden');
    showToast('Подписка на анонсы оформлена!');
}

function resetCommunityForm() { document.getElementById('sub-email').value = ''; document.getElementById('community-success').classList.add('hidden'); document.getElementById('community-form').classList.remove('hidden'); }

function openEventPage(eventId) { state.selectedEventId = eventId; switchView('event'); }

function renderEventDetail() {
    const ev = EVENTS.find(e => e.id === state.selectedEventId) || EVENTS[0], reg = state.registeredEvents.includes(ev.id), saved = state.savedEvents.includes(ev.id);
    const banner = ev.ornamentId === 'mezen' ? getMezenFriezeSVG() : `<div class="p-6 craft-texture flex items-center justify-center gap-6"><div class="w-36 h-36 sm:w-44 sm:h-44 border hairline-strong bg-parchment p-2 rounded-sm shadow-sm">${getOrnamentTileSVG(ev.ornamentId)}</div><div class="hidden sm:block w-36 h-36 sm:w-44 sm:h-44 border hairline-strong bg-parchment p-2 rounded-sm shadow-sm opacity-90">${getOrnamentTileSVG(ev.ornamentId)}</div></div>`;
    document.getElementById('event-detail-container').innerHTML = `
        <div class="section-pad px-5 sm:px-10 py-4 border-b hairline bg-parchment flex flex-wrap items-center justify-between gap-3"><button type="button" onclick="switchView('home');setTimeout(()=>document.getElementById('section-events').scrollIntoView({behavior:'smooth'}),120)" class="text-sm font-bold text-ink hover:text-cinnabar flex items-center gap-1.5 cursor-pointer"><span>←</span><span>Ко всем событиям</span></button><select onchange="openEventPage(this.value)" class="bg-linen border hairline-strong rounded-sm px-2.5 py-1 text-xs text-ink font-bold cursor-pointer">${EVENTS.map(i => `<option value="${i.id}" ${i.id === ev.id ? 'selected' : ''}>${i.title}</option>`).join('')}</select></div>
        <section class="border-b hairline-strong"><div class="responsive-grid-12 grid grid-cols-1 lg:grid-cols-12">
            <div class="responsive-col-span lg:col-span-6 section-pad px-5 sm:px-10 py-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r hairline">
                <div>
                    <div class="flex flex-wrap items-center gap-2 mb-5"><span class="px-3 py-1 rounded-sm text-xs font-bold ${ev.format === 'Офлайн' ? 'bg-forest text-parchment' : 'bg-gold/30 text-ink border border-gold'}">${ev.format}</span><span class="px-3 py-1 rounded-sm bg-parchment border hairline text-xs font-bold text-ink">${ev.date}</span><span class="px-3 py-1 rounded-sm bg-parchment border hairline text-xs font-bold text-cinnabar">${ev.topic}</span></div>
                    <h1 class="font-serif font-bold text-4xl sm:text-5xl text-ink leading-tight mb-4">${ev.title}</h1>
                    <p class="text-sm sm:text-base text-ink/80 leading-relaxed mb-6">${ev.fullDesc}</p>
                    <div class="p-4 bg-parchment border hairline rounded-sm space-y-2 text-sm mb-7"><div><strong class="text-ink/65">Дата:</strong> ${ev.date}, ${ev.time}</div><div><strong class="text-ink/65">Место:</strong> ${ev.location}</div><div><strong class="text-ink/65">Участие:</strong> <span class="text-forest font-bold">Бесплатно</span></div></div>
                </div>
                <div class="flex flex-wrap items-center gap-3">${reg ? `<button type="button" onclick="openRegisterModal('${ev.id}',true)" class="px-6 py-3.5 rounded-md bg-forest/15 border border-forest text-forest font-bold text-sm cursor-pointer">✓ Вы записаны (Билет)</button>` : `<button type="button" onclick="openRegisterModal('${ev.id}',false)" class="px-7 py-3.5 rounded-md bg-forest hover:bg-forestHover text-parchment font-bold text-sm sm:text-base cursor-pointer">Записаться на участие</button>`}<button type="button" onclick="toggleSaveEvent('${ev.id}')" class="px-4 py-3.5 rounded-md border hairline-strong bg-parchment hover:bg-craft text-sm font-bold cursor-pointer">${saved ? '✓ В сохранённых' : 'Сохранить'}</button></div>
            </div>
            <div class="responsive-col-span lg:col-span-6 craft-texture section-pad p-5 sm:p-8 flex flex-col justify-center"><div class="bg-parchment border hairline-strong p-3 rounded-sm shadow-sm overflow-hidden">${banner}</div></div>
        </div></section>
        <section class="section-pad px-5 sm:px-10 py-12"><div class="responsive-grid-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="responsive-col-span lg:col-span-7"><h2 class="font-serif font-bold text-3xl text-ink mb-6">Программа события</h2><div class="border-l-2 border-cinnabar/40 pl-6 space-y-6">${ev.program.map(s => `<div class="relative"><span class="w-3 h-3 rounded-full bg-cinnabar border-2 border-linen absolute -left-[31px] top-1.5"></span><div class="text-xs font-bold uppercase text-cinnabar">${s.time}</div><h3 class="font-serif font-bold text-2xl text-ink">${s.title}</h3><p class="text-sm text-ink/75 mt-1">${s.desc}</p></div>`).join('')}</div></div>
            <div class="responsive-col-span lg:col-span-5"><h2 class="font-serif font-bold text-3xl text-ink mb-6">Спикеры</h2><div class="space-y-4">${ev.speakers.map(sp => `<div class="p-4 bg-parchment border hairline-strong rounded-sm flex items-center gap-4"><div class="w-14 h-14 rounded-full border hairline-strong flex items-center justify-center font-serif font-bold text-xl text-parchment shrink-0" style="background-color:${sp.color}">${sp.initials}</div><div><div class="font-serif font-bold text-xl text-ink">${sp.name}</div><div class="text-xs text-ink/70 mt-1">${sp.role}</div></div></div>`).join('')}</div></div>
        </div></section>`;
}

function openRegisterModal(eventId, already) {
    state.selectedEventId = eventId;
    const ev = EVENTS.find(e => e.id === eventId) || EVENTS[0];
    document.getElementById('reg-modal-event-title').textContent = ev.title;
    document.getElementById('reg-modal-event-meta').textContent = `${ev.date} · ${ev.format} · ${ev.location}`;
    document.getElementById('reg-error').classList.add('hidden');
    const f = document.getElementById('event-register-form'), s = document.getElementById('event-register-success');
    if (already) {
        f.classList.add('hidden');
        document.getElementById('reg-success-desc').textContent = `Ваше место на событии «${ev.title}» (${ev.date}) подтверждено.`;
        document.getElementById('reg-ticket-code').textContent = `KM-2026-${ev.id.slice(-3).toUpperCase()}`;
        s.classList.remove('hidden');
    } else { s.classList.add('hidden'); f.classList.remove('hidden'); }
    document.getElementById('modal-register').classList.remove('hidden');
}

function submitEventRegistration(e) {
    e.preventDefault();
    const n = document.getElementById('reg-name').value.trim(), em = document.getElementById('reg-email').value.trim(), org = document.getElementById('reg-org').value.trim(), err = document.getElementById('reg-error');
    if (!n || !em || !org) { err.textContent = 'Заполните все обязательные поля.'; err.classList.remove('hidden'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err.textContent = 'Проверьте корректность электронной почты.'; err.classList.remove('hidden'); return; }
    const ev = EVENTS.find(i => i.id === state.selectedEventId) || EVENTS[0];
    if (!state.registeredEvents.includes(ev.id)) { state.registeredEvents.push(ev.id); savePersistedState(); }
    document.getElementById('event-register-form').classList.add('hidden');
    document.getElementById('reg-success-desc').textContent = `${n}, ждём вас на событии «${ev.title}» (${ev.date}).`;
    document.getElementById('reg-ticket-code').textContent = `KM-2026-${ev.id.slice(-3).toUpperCase()}`;
    document.getElementById('event-register-success').classList.remove('hidden');
    syncAllUI(); showToast(`Вы записаны на «${ev.title}»!`);
}

function renderProfile() {
    // Синхронизируем карточку профиля с актуальными данными
    renderProfileCard();
    updateAuthHeaderBtn();

    // Показываем баннер гостя / скрываем основной контент профиля
    const guestBanner = document.getElementById('profile-guest-banner');
    const mainContent  = document.getElementById('profile-main-content');
    if (guestBanner) guestBanner.classList.toggle('hidden', !!state.currentUser);
    if (mainContent)  mainContent.classList.toggle('hidden', !state.currentUser);

    document.getElementById('profile-interests-container').innerHTML = ALL_INTERESTS.map(tag => {
        const a = state.userInterests.includes(tag);
        return `<button type="button" onclick="toggleUserInterest('${tag}')" class="px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${a ? 'bg-forest text-parchment border border-forest' : 'bg-linen text-ink border hairline-strong hover:bg-craft'}">${a ? '✓ ' : '+ '}${tag}</button>`;
    }).join('');
    document.getElementById('stat-registrations').textContent = state.registeredEvents.length;
    document.getElementById('stat-ornaments').textContent = `${state.collectedOrnaments.length}/${ORNAMENTS.length}`;
    document.getElementById('stat-saved').textContent = state.savedMedia.length + state.savedEvents.length;

    const rc = document.getElementById('profile-registrations-list');
    rc.innerHTML = !state.registeredEvents.length ? `<p class="text-sm text-ink/65 py-3">У вас пока нет активных записей.</p>` :
        state.registeredEvents.map(id => {
            const ev = EVENTS.find(e => e.id === id); if (!ev) return '';
            return `<div class="p-4 bg-linen border hairline rounded-sm flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3.5"><div class="w-12 h-12 shrink-0 border hairline bg-parchment rounded-sm overflow-hidden">${getOrnamentTileSVG(ev.ornamentId)}</div><div><div class="text-xs font-bold text-cinnabar">${ev.date} · ${ev.format}</div><div class="font-serif font-bold text-xl text-ink">${ev.title}</div></div></div><div class="flex items-center gap-2"><button type="button" onclick="openEventPage('${ev.id}')" class="px-3 py-1.5 rounded-md border hairline-strong bg-parchment hover:bg-craft text-xs font-bold cursor-pointer">Открыть</button><button type="button" onclick="cancelRegistration('${ev.id}')" class="px-3 py-1.5 rounded-md text-xs font-bold text-cinnabar hover:bg-cinnabar/10 cursor-pointer">Отменить</button></div></div>`;
        }).join('');

    const cc = state.collectedOrnaments.length;
    document.getElementById('profile-collection-progress').textContent = `Собрано ${cc} из ${ORNAMENTS.length} узоров`;
    document.getElementById('profile-collection-bar').style.width = `${(cc / ORNAMENTS.length) * 100}%`;
    document.getElementById('profile-ornaments-grid').innerHTML = ORNAMENTS.map(o => {
        if (state.collectedOrnaments.includes(o.id)) {
            return `<div onclick="openOrnamentModal('${o.id}')" class="p-3 bg-linen border hairline-strong stamp-collected rounded-sm text-center cursor-pointer"><div class="aspect-square mb-2 border hairline bg-parchment overflow-hidden rounded-sm">${getOrnamentTileSVG(o.id)}</div><div class="font-serif font-bold text-lg text-ink">${o.shortName}</div><div class="text-[11px] font-bold text-forest">✓ Собран</div></div>`;
        }
        return `<div class="p-3 bg-linen/50 border border-dashed border-ink/40 rounded-sm text-center flex flex-col justify-between"><div class="aspect-square mb-2 bg-craft/50 rounded-sm flex items-center justify-center opacity-35 grayscale">${getOrnamentTileSVG(o.id)}</div><div><div class="font-serif font-bold text-lg text-ink/60">${o.shortName}</div><button type="button" onclick="switchView('atlas')" class="mt-1.5 text-[11px] font-bold text-cinnabar underline cursor-pointer">Найти в Атласе →</button></div></div>`;
    }).join('');

    const achs = [
        { title: 'Хранитель традиций', desc: 'Собрано 2+ узора', unlocked: cc >= 2, progress: `${Math.min(2, cc)}/2`, color: '#A63426', icon: 'M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5Z' },
        { title: 'Мастер орнамента', desc: 'Собраны все 4 узора', unlocked: cc >= 4, progress: `${cc}/4`, color: '#B88A44', icon: 'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8Z' },
        { title: 'Этнограф', desc: 'Сохранён материал', unlocked: state.savedMedia.length >= 1, progress: `${Math.min(1, state.savedMedia.length)}/1`, color: '#2F4A37', icon: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5V5.5z' },
        { title: 'Активист', desc: 'Запись на 2+ события', unlocked: state.registeredEvents.length >= 2, progress: `${Math.min(2, state.registeredEvents.length)}/2`, color: '#1F1D1A', icon: 'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm0 3.5v4l3 2' }
    ];
    document.getElementById('profile-achievements-grid').innerHTML = achs.map(a => `<div class="p-4 rounded-sm border text-center flex flex-col items-center justify-between ${a.unlocked ? 'bg-linen hairline-strong' : 'bg-craft/40 border-dashed border-ink/30 opacity-70'}"><div class="w-14 h-14 mb-2.5 relative flex items-center justify-center"><svg viewBox="0 0 64 64" class="w-full h-full"><polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="${a.unlocked ? a.color : '#CFC4B2'}" stroke="#1F1D1A" stroke-width="1.6"/></svg><svg class="w-6 h-6 absolute text-parchment" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="${a.icon}"/></svg></div><div><div class="font-serif font-bold text-lg text-ink">${a.title}</div><div class="text-[11px] text-ink/70 mt-1">${a.desc}</div></div><div class="mt-2.5 text-[11px] font-bold px-2 py-0.5 rounded-sm ${a.unlocked ? 'bg-forest/15 text-forest' : 'bg-parchment text-ink/60 border hairline'}">${a.unlocked ? 'Открыто ✓' : a.progress}</div></div>`).join('');

    const sl = document.getElementById('profile-saved-list'), items = [];
    state.savedMedia.forEach(mid => { const m = MEDIA_ITEMS.find(x => x.id === mid); if (m) items.push(`<div class="p-3.5 bg-linen border hairline rounded-sm flex flex-wrap items-center justify-between gap-3"><div><span class="text-[11px] uppercase font-bold text-cinnabar">${m.type}</span><div class="font-serif font-bold text-xl text-ink">${m.title}</div></div><button type="button" onclick="toggleSaveMedia('${m.id}')" class="text-xs font-bold text-cinnabar cursor-pointer">Убрать</button></div>`); });
    state.savedEvents.forEach(eid => { const ev = EVENTS.find(x => x.id === eid); if (ev) items.push(`<div class="p-3.5 bg-linen border hairline rounded-sm flex flex-wrap items-center justify-between gap-3"><div><span class="text-[11px] uppercase font-bold text-forest">Событие · ${ev.date}</span><div class="font-serif font-bold text-xl text-ink">${ev.title}</div></div><button type="button" onclick="openEventPage('${ev.id}')" class="px-3 py-1.5 rounded-md border hairline-strong bg-parchment text-xs font-bold cursor-pointer">К событию</button></div>`); });
    sl.innerHTML = items.length ? items.join('') : `<p class="text-sm text-ink/65 py-2">Сохранённых материалов пока нет.</p>`;
}

function toggleUserInterest(tag) { state.userInterests = state.userInterests.includes(tag) ? state.userInterests.filter(t => t !== tag) : [...state.userInterests, tag]; savePersistedState(); renderProfile(); }
function cancelRegistration(id) { state.registeredEvents = state.registeredEvents.filter(x => x !== id); savePersistedState(); syncAllUI(); showToast('Запись отменена'); }

function renderUIKit() {
    document.getElementById('uikit-colors-grid').innerHTML = UIKIT_COLORS.map(c => `<button type="button" onclick="copyHex('${c.hex}')" class="text-left bg-parchment border hairline-strong rounded-sm overflow-hidden hover:shadow-md transition cursor-pointer group"><div class="h-24 p-3 flex items-end justify-between border-b hairline" style="background-color:${c.hex}"><span class="text-xs font-bold px-2 py-0.5 rounded-sm ${c.textDark ? 'bg-parchment/80 text-ink' : 'bg-ink/40 text-parchment'}">${c.hex}</span><span class="text-[11px] opacity-0 group-hover:opacity-100 transition ${c.textDark ? 'text-ink' : 'text-parchment'}">Копировать</span></div><div class="p-3.5"><div class="font-serif font-bold text-xl text-ink">${c.name}</div><div class="text-xs text-ink/65 mt-0.5">${c.role}</div></div></button>`).join('');
    document.getElementById('uikit-ornaments-grid').innerHTML = ORNAMENTS.map(o => `<div class="bg-parchment border hairline-strong rounded-sm p-4 text-center"><div class="aspect-square mb-3 border hairline bg-linen overflow-hidden rounded-sm">${getOrnamentTileSVG(o.id)}</div><div class="font-serif font-bold text-xl text-ink">${o.shortName}</div><div class="text-xs text-cinnabar font-bold mt-0.5">${o.region.split('·')[0].trim()}</div></div>`).join('');
}

async function copyHex(hex) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(hex); showToast(`Цвет ${hex} скопирован`); return; } } catch (_) {}
    try { const ta = document.createElement('textarea'); ta.value = hex; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast(`Цвет ${hex} скопирован`); } catch (_) { showToast(`HEX: ${hex}`); }
}

function toggleCollectOrnament(id) {
    const o = ORNAMENTS.find(i => i.id === id); if (!o) return;
    if (state.collectedOrnaments.includes(id)) { state.collectedOrnaments = state.collectedOrnaments.filter(x => x !== id); showToast(`Узор «${o.shortName}» убран`); }
    else { state.collectedOrnaments.push(id); showToast(`Узор «${o.shortName}» добавлен в коллекцию!`); }
    savePersistedState(); syncAllUI();
}
function toggleSaveMedia(id) { state.savedMedia = state.savedMedia.includes(id) ? state.savedMedia.filter(x => x !== id) : [...state.savedMedia, id]; savePersistedState(); syncAllUI(); }
function toggleSaveEvent(id) { state.savedEvents = state.savedEvents.includes(id) ? state.savedEvents.filter(x => x !== id) : [...state.savedEvents, id]; savePersistedState(); syncAllUI(); }

function openOrnamentModal(id) {
    const o = ORNAMENTS.find(i => i.id === id); if (!o) return;
    const c = state.collectedOrnaments.includes(o.id);
    document.getElementById('detail-modal-eyebrow').textContent = o.region;
    document.getElementById('detail-modal-title').textContent = o.name;
    document.getElementById('detail-modal-body').innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center"><div class="sm:col-span-5 p-3 bg-linen border hairline-strong rounded-sm"><div class="aspect-square border hairline bg-parchment overflow-hidden rounded-sm">${getOrnamentTileSVG(o.id)}</div></div><div class="sm:col-span-7 space-y-3"><div class="text-xs px-2.5 py-1 bg-craft border hairline inline-block rounded-sm font-bold">${o.origin}</div><p class="text-sm text-ink/85">${o.history}</p><p class="text-sm text-ink/85">${o.symbolism}</p></div></div><div class="pt-4 border-t hairline flex justify-between"><button type="button" onclick="toggleCollectOrnament('${o.id}');openOrnamentModal('${o.id}')" class="px-5 py-2.5 rounded-md text-sm font-bold cursor-pointer ${c ? 'bg-forest/15 border border-forest text-forest' : 'bg-forest text-parchment'}">${c ? '✓ В коллекции' : '+ В коллекцию'}</button><button type="button" onclick="closeModal('modal-detail')" class="px-4 py-2.5 rounded-md border hairline-strong text-sm font-bold cursor-pointer">Закрыть</button></div>`;
    document.getElementById('modal-detail').classList.remove('hidden');
}

function openArticleModal(id) {
    const m = MEDIA_ITEMS.find(x => x.id === id); if (!m) return;
    document.getElementById('detail-modal-eyebrow').textContent = `${m.type} · ${m.duration}`;
    document.getElementById('detail-modal-title').textContent = m.title;
    document.getElementById('detail-modal-body').innerHTML = `<div class="space-y-3.5 text-sm sm:text-base text-ink/85 leading-relaxed">${m.articleBody.map(p => `<p>${p}</p>`).join('')}</div><div class="pt-4 border-t hairline flex justify-end"><button type="button" onclick="closeModal('modal-detail')" class="px-4 py-2.5 rounded-md border hairline-strong text-sm font-bold cursor-pointer">Закрыть</button></div>`;
    document.getElementById('modal-detail').classList.remove('hidden');
}

function openVideoModal(id) {
    const m = MEDIA_ITEMS.find(x => x.id === id); if (!m) return;
    state.videoPlaying = true; state.videoProgress = 18;
    if (state.videoTimer) clearInterval(state.videoTimer);
    document.getElementById('detail-modal-eyebrow').textContent = `${m.type} · ${m.duration}`;
    document.getElementById('detail-modal-title').textContent = m.title;
    document.getElementById('detail-modal-body').innerHTML = `<div class="bg-ink rounded-sm overflow-hidden border hairline-strong"><div class="p-4 bg-[#F6EFE4]">${getMezenFriezeSVG()}</div><div class="px-4 py-3 bg-ink text-parchment flex items-center gap-3"><button type="button" id="video-play-btn" onclick="toggleVideoSim()" class="px-3 py-1 rounded bg-cinnabar text-xs font-bold cursor-pointer">Пауза</button><div class="flex-1 h-1.5 bg-parchment/25 rounded-full overflow-hidden"><div id="video-sim-bar" class="h-full bg-gold transition-all duration-500" style="width:18%"></div></div><span class="text-xs font-mono">${m.duration}</span></div></div>`;
    document.getElementById('modal-detail').classList.remove('hidden');
    state.videoTimer = setInterval(() => { if (!state.videoPlaying) return; state.videoProgress = state.videoProgress >= 100 ? 0 : state.videoProgress + 4; const b = document.getElementById('video-sim-bar'); if (b) b.style.width = `${state.videoProgress}%`; }, 600);
}

function toggleVideoSim() { state.videoPlaying = !state.videoPlaying; const b = document.getElementById('video-play-btn'); if (b) b.textContent = state.videoPlaying ? 'Пауза' : 'Смотреть'; }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); if (id === 'modal-detail' && state.videoTimer) { clearInterval(state.videoTimer); state.videoPlaying = false; } }
function syncAllUI() {
    const total = state.registeredEvents.length + state.savedMedia.length + state.savedEvents.length;
    const hb = document.getElementById('header-badge-count'), mb = document.getElementById('mobile-badge-count');
    if (hb) hb.textContent = total;
    if (mb) mb.textContent = total;
    selectMapRegion(state.selectedRegion);
    renderHomeAtlas(); renderEventsGrid(); renderMediaGrid();
    if (state.currentView === 'blog') renderBlogPosts();
    if (state.currentView === 'atlas') renderFullAtlas();
    if (state.currentView === 'event') renderEventDetail();
    if (state.currentView === 'profile') renderProfile();
}

function showToast(msg) {
    const c = document.getElementById('toast-container'), t = document.createElement('div');
    t.className = 'pointer-events-auto px-4 py-3 rounded-sm bg-ink text-parchment border border-gold/50 shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-[fadeIn_0.2s_ease-out]';
    t.innerHTML = `<span class="text-gold">◆</span><span>${escapeHtml(msg)}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.25s ease'; setTimeout(() => t.remove(), 260); }, 3000);
}

/* =========================================================================
   9. ГЛОБАЛЬНЫЕ СОБЫТИЯ И ЗАПУСК
   ========================================================================= */
/* =========================================================================
   СИСТЕМА РЕГИСТРАЦИИ И АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЯ
   ========================================================================= */

/* --- Вспомогательная функция открытия модалки регистрации/входа --- */
function openAuthModal(tab = 'login') {
    switchAuthTab(tab);
    document.getElementById('login-error')?.classList.add('hidden');
    document.getElementById('register-error')?.classList.add('hidden');
    document.getElementById('modal-auth').classList.remove('hidden');
}

/* --- Переключение вкладки Вход / Регистрация --- */
function switchAuthTab(tab) {
    const loginForm = document.getElementById('user-login-form');
    const regForm   = document.getElementById('user-register-form');
    const tabLogin  = document.getElementById('auth-tab-login');
    const tabReg    = document.getElementById('auth-tab-register');
    const title     = document.getElementById('auth-modal-title');
    if (!loginForm || !regForm) return;

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        tabLogin.className = 'py-3 bg-forest text-parchment cursor-pointer transition text-xs font-bold';
        tabReg.className   = 'py-3 text-ink hover:bg-craft cursor-pointer transition text-xs font-bold';
        if (title) title.textContent = 'Вход в систему';
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        tabLogin.className = 'py-3 text-ink hover:bg-craft cursor-pointer transition text-xs font-bold';
        tabReg.className   = 'py-3 bg-forest text-parchment cursor-pointer transition text-xs font-bold';
        if (title) title.textContent = 'Регистрация';
    }
}

/* --- Вход пользователя --- */
function handleUserLogin(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const err      = document.getElementById('login-error');

    if (!email || !password) {
        err.textContent = 'Введите почту и пароль.';
        err.classList.remove('hidden'); return;
    }

    // Проверяем по хранилищу зарегистрированных пользователей
    const users = getRegisteredUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
        err.textContent = 'Неверная почта или пароль.';
        err.classList.remove('hidden'); return;
    }

    loginUser(user);
    closeModal('modal-auth');
    showToast(`Добро пожаловать, ${user.firstname}!`);
    renderProfileCard();
    updateAuthHeaderBtn();
}

/* --- Регистрация нового пользователя --- */
function handleUserRegister(e) {
    e.preventDefault();
    const email      = document.getElementById('reg-u-email').value.trim();
    const password   = document.getElementById('reg-u-password').value;
    const lastname   = document.getElementById('reg-u-lastname').value.trim();
    const firstname  = document.getElementById('reg-u-firstname').value.trim();
    const middlename = document.getElementById('reg-u-middlename').value.trim();
    const org        = document.getElementById('reg-u-org').value.trim();
    const birthdate  = document.getElementById('reg-u-birthdate').value;
    const phone      = document.getElementById('reg-u-phone').value.trim();
    const err        = document.getElementById('register-error');

    // Валидация
    if (!email || !password || !lastname || !firstname || !org || !birthdate || !phone) {
        err.textContent = 'Пожалуйста, заполните все обязательные поля (*).';
        err.classList.remove('hidden'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = 'Введите корректный адрес электронной почты.';
        err.classList.remove('hidden'); return;
    }
    if (password.length < 4) {
        err.textContent = 'Пароль должен содержать минимум 4 символа.';
        err.classList.remove('hidden'); return;
    }
    if (!/^\+?[\d\s\(\)\-]{7,}$/.test(phone)) {
        err.textContent = 'Введите корректный номер телефона.';
        err.classList.remove('hidden'); return;
    }

    // Проверка дубликата
    const users = getRegisteredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        err.textContent = 'Пользователь с такой почтой уже зарегистрирован.';
        err.classList.remove('hidden'); return;
    }

    // Сохраняем нового пользователя
    const newUser = { email, password, lastname, firstname, middlename, org, birthdate, phone };
    users.push(newUser);
    saveRegisteredUsers(users);

    // Автоматически входим
    loginUser(newUser);
    closeModal('modal-auth');
    showToast(`Регистрация прошла успешно! Добро пожаловать, ${firstname}!`);
    renderProfileCard();
    updateAuthHeaderBtn();
    switchView('profile');
}

/* --- Вспомогательные функции хранилища пользователей --- */
function getRegisteredUsers() {
    try { return JSON.parse(localStorage.getItem('km_users') || '[]'); } catch { return []; }
}
function saveRegisteredUsers(users) {
    try { localStorage.setItem('km_users', JSON.stringify(users)); } catch {}
}

/* --- Вход / выход текущего пользователя --- */
function loginUser(user) {
    state.currentUser = { ...user };
    // Заполняем поля профиля из данных регистрации
    if (!state.userProfile.lastname) {
        state.userProfile.lastname   = user.lastname;
        state.userProfile.firstname  = user.firstname;
        state.userProfile.middlename = user.middlename || '';
        state.userProfile.org        = user.org;
        state.userProfile.birthdate  = user.birthdate;
        state.userProfile.phone      = user.phone;
        state.userProfile.email      = user.email;
    }
    savePersistedState();
}

function logoutUser() {
    state.currentUser = null;
    savePersistedState();
    updateAuthHeaderBtn();
    renderProfileCard();
    showToast('Вы вышли из личного кабинета');
    switchView('home');
}

/* --- Обновление кнопки входа в шапке --- */
function updateAuthHeaderBtn() {
    const btn  = document.getElementById('header-auth-btn');
    const lbl  = document.getElementById('header-auth-label');
    const mLbl = document.getElementById('mobile-auth-label');
    if (btn && lbl) {
        if (state.currentUser) {
            const initials = ((state.currentUser.firstname || '')[0] || '') + ((state.currentUser.lastname || '')[0] || '');
            lbl.textContent = initials.toUpperCase() || state.currentUser.email.substring(0, 2).toUpperCase();
            btn.title = `${state.currentUser.firstname} ${state.currentUser.lastname} · Личный кабинет`;
        } else {
            lbl.textContent = 'Войти';
            btn.title = 'Вход / Регистрация';
        }
    }
    if (mLbl) {
        mLbl.textContent = state.currentUser
            ? `${state.currentUser.firstname} ${state.currentUser.lastname} · Кабинет`
            : 'Войти / Зарегистрироваться';
    }
}

/* --- Рендер карточки профиля --- */
function renderProfileCard() {
    const viewCard = document.getElementById('profile-view-card');
    if (!viewCard) return;

    const u = state.userProfile;
    const fullName = [u.lastname, u.firstname, u.middlename].filter(Boolean).join(' ') || 'Пользователь';
    const initials = [(u.firstname || '')[0], (u.lastname || '')[0]].filter(Boolean).join('').toUpperCase() || 'АБ';

    const avatarEl = document.getElementById('profile-avatar-initials');
    if (avatarEl) avatarEl.textContent = initials;

    const nameEl = document.getElementById('profile-full-name');
    if (nameEl) nameEl.textContent = fullName;

    const orgEl = document.getElementById('profile-org');
    if (orgEl) orgEl.textContent = u.org || '';

    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.textContent = u.email || '';

    const phoneEl = document.getElementById('profile-phone');
    if (phoneEl) phoneEl.textContent = u.phone || '';

    const bdEl = document.getElementById('profile-birthdate');
    if (bdEl) {
        if (u.birthdate) {
            try {
                const d = new Date(u.birthdate);
                bdEl.textContent = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
            } catch { bdEl.textContent = u.birthdate; }
        } else {
            bdEl.textContent = '';
        }
    }

    // Показываем кнопку «Выйти» только если вошли
    const logoutBtn = document.querySelector('[onclick="logoutUser()"]');
    if (logoutBtn) logoutBtn.style.display = state.currentUser ? '' : 'none';
}
/* --- Переключение режима редактирования профиля --- */
function toggleProfileEdit(isEdit) {
    document.getElementById('profile-view-card').style.display = isEdit ? 'none' : '';
    document.getElementById('profile-edit-form').classList.toggle('hidden', !isEdit);

    if (isEdit) {
        const u = state.userProfile;
        document.getElementById('edit-lastname').value   = u.lastname   || '';
        document.getElementById('edit-firstname').value  = u.firstname  || '';
        document.getElementById('edit-middlename').value = u.middlename || '';
        document.getElementById('edit-org').value        = u.org        || '';
        document.getElementById('edit-birthdate').value  = u.birthdate  || '';
        document.getElementById('edit-phone').value      = u.phone      || '';
    }
}

/* --- Сохранение изменений профиля --- */
function saveProfileSettings(e) {
    e.preventDefault();
    state.userProfile.lastname   = document.getElementById('edit-lastname').value.trim();
    state.userProfile.firstname  = document.getElementById('edit-firstname').value.trim();
    state.userProfile.middlename = document.getElementById('edit-middlename').value.trim();
    state.userProfile.org        = document.getElementById('edit-org').value.trim();
    state.userProfile.birthdate  = document.getElementById('edit-birthdate').value;
    state.userProfile.phone      = document.getElementById('edit-phone').value.trim();

    // Обновляем email в записи пользователя из логина
    if (state.currentUser) {
        state.currentUser.lastname   = state.userProfile.lastname;
        state.currentUser.firstname  = state.userProfile.firstname;
        state.currentUser.middlename = state.userProfile.middlename;
        state.currentUser.org        = state.userProfile.org;
        state.currentUser.birthdate  = state.userProfile.birthdate;
        state.currentUser.phone      = state.userProfile.phone;

        // Обновляем в базе пользователей
        const users = getRegisteredUsers();
        const idx = users.findIndex(u => u.email === state.currentUser.email);
        if (idx !== -1) users[idx] = { ...users[idx], ...state.currentUser };
        saveRegisteredUsers(users);
    }

    savePersistedState();
    toggleProfileEdit(false);
    renderProfileCard();
    updateAuthHeaderBtn();
    showToast('Профиль обновлён!');
}

['modal-register', 'modal-detail', 'modal-admin-login', 'modal-auth'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => { if (e.target.id === id) closeModal(id); });
});
document.addEventListener('click', (e) => {
    const m = document.getElementById('mobile-menu'), b = document.getElementById('mobile-menu-btn');
    if (m && !m.classList.contains('hidden') && !m.contains(e.target) && b && !b.contains(e.target)) toggleMobileMenu(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal('modal-register'); closeModal('modal-detail'); closeModal('modal-admin-login'); closeModal('modal-auth'); toggleMobileMenu(false); }
});

window.addEventListener('DOMContentLoaded', async () => {
    try {
        loadPersistedState();
        enhanceAdminFormForAudio();
        document.getElementById('hero-mezen-container').innerHTML = getMezenFriezeSVG();
        document.getElementById('community-top-strip').innerHTML = getOrnamentStripSVG();
        document.getElementById('footer-ornament-strip').innerHTML = getOrnamentStripSVG();
        initRussiaMap();
        setupMapPanEvents();
        renderEventFilters();
        renderSubInterests();
        renderUIKit();
        syncAllUI();

        if (supabaseClient) {
            const { data } = await supabaseClient.auth.getSession();
            if (data?.session?.user) {
                state.adminSession = { mode: 'cloud', email: data.session.user.email };
                updateAdminHeaderBadge();
            }
        }
        await loadBlogPosts();

        const toolbar = document.getElementById('jury-toolbar');
        if (toolbar && 'ResizeObserver' in window) new ResizeObserver(updateHeaderOffset).observe(toolbar);
        window.addEventListener('resize', updateHeaderOffset);
        updateHeaderOffset();

        const h = (window.location.hash || '').replace('#', '');
        switchView(['home', 'blog', 'atlas', 'event', 'profile', 'uikit'].includes(h) ? h : 'home', false);

        // Инициализируем кнопку и карточку пользователя
        updateAuthHeaderBtn();
        renderProfileCard();
    } catch (err) {
        console.error('Ошибка инициализации:', err);
    }
});
