import Animated, {Easing} from 'react-native-reanimated';

export const internalSymbolKey = Symbol.for('$');
export const internalSerializeKey = '$';
export const localMusicSheetId = 'local-music-sheet';
export const musicHistorySheetId = 'history-music-sheet';

export const localPluginPlatform = '本地';
export const localPluginHash = 'local-plugin-hash';

export const internalFakeSoundKey = 'fake-key';

const emptyFunction = () => {};
Object.freeze(emptyFunction);
export {emptyFunction};

export enum RequestStateCode {
    /** 空闲 */
    IDLE = 0b00000000,
    PENDING_FIRST_PAGE = 0b00000010,
    LOADING = 0b00000010,
    /** 检索中 */
    PENDING_REST_PAGE = 0b00000011,
    /** 部分结束 */
    PARTLY_DONE = 0b00000100,
    /** 全部结束 */
    FINISHED = 0b0001000,
    /** 出错了 */
    ERROR = 0b10000000,
}

export const StorageKeys = {
    MediaMetaKeys: 'media-meta-keys',
    PluginMetaKey: 'plugin-meta',
    MediaCache: 'media-cache',
    LocalMusicSheet: 'local-music-sheet',
};

export const CacheControl = {
    Cache: 'cache',
    NoCache: 'no-cache',
    NoStore: 'no-store',
};

export const supportLocalMediaType = [
    '.mp3',
    '.flac',
    '.wma',
    '.wav',
    '.m4a',
    '.ogg',
    '.acc',
    '.aac',
    '.ape',
    '.opus',
];

/** 全局事件 */
export enum EDeviceEvents {
    /** 刷新歌词 */
    REFRESH_LYRIC = 'refresh-lyric',
}

const ANIMATION_EASING: Animated.EasingFunction = Easing.out(Easing.exp);
const ANIMATION_DURATION = 150;

const animationFast = {
    duration: ANIMATION_DURATION,
    easing: ANIMATION_EASING,
};

const animationNormal = {
    duration: 250,
    easing: ANIMATION_EASING,
};

const animationSlow = {
    duration: 500,
    easing: ANIMATION_EASING,
};

export const timingConfig = {
    animationFast,
    animationNormal,
    animationSlow,
};
