import React from 'react';
import {StyleSheet, View} from 'react-native';
import rpx from '@/utils/rpx';
import {iconSizeConst} from '@/constants/uiConst';
import LyricIcon from '@/assets/icons/lyric.svg';
import TranslationIcon from '@/assets/icons/translation.svg';
import Config from '@/core/config';
import useColors from '@/hooks/useColors';
import LyricManager from '@/core/lyricManager';
import LyricUtil from '@/native/lyricUtil';
import Toast from '@/utils/toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {hidePanel, showPanel} from '@/components/panels/usePanel';
import TrackPlayer from '@/core/trackPlayer';
import MediaExtra from '@/core/mediaExtra';

interface ILyricOperationsProps {}

export default function LyricOperations(_props: ILyricOperationsProps) {
    const lyricConfig = Config.useConfig('setting.lyric');

    const hasTranslation = LyricManager.useLyricState()?.hasTranslation;
    const colors = useColors();

    return (
        <View style={styles.container}>
            <Icon
                name="format-font-size-increase"
                size={iconSizeConst.normal}
                color="white"
                onPress={() => {
                    showPanel('SetFontSize', {
                        defaultSelect: lyricConfig?.detailFontSize ?? 1,
                        onSelectChange(value) {
                            Config.set('setting.lyric.detailFontSize', value);
                        },
                    });
                }}
            />
            <Icon
                name="arrow-left-right"
                size={iconSizeConst.normal}
                color="white"
                onPress={() => {
                    const currentMusicItem = TrackPlayer.getCurrentMusic();

                    if (currentMusicItem) {
                        showPanel('SetLyricOffset', {
                            musicItem: currentMusicItem,
                            onSubmit(offset) {
                                MediaExtra.update(currentMusicItem, {
                                    lyricOffset: offset,
                                });
                                LyricManager.refreshLyric();
                                hidePanel();
                            },
                        });
                    }
                }}
            />

            <Icon
                name="magnify"
                size={iconSizeConst.normal}
                color="white"
                onPress={() => {
                    const currentMusic = TrackPlayer.getCurrentMusic();
                    if (!currentMusic) {
                        return;
                    }
                    // if (
                    //     Config.get('setting.basic.associateLyricType') ===
                    //     'input'
                    // ) {
                    //     showPanel('AssociateLrc', {
                    //         musicItem: currentMusic,
                    //     });
                    // } else {
                    showPanel('SearchLrc', {
                        musicItem: currentMusic,
                    });
                    // }
                }}
            />
            <LyricIcon
                onPress={async () => {
                    if (!lyricConfig?.showStatusBarLyric) {
                        const hasPermission =
                            await LyricUtil.checkSystemAlertPermission();

                        if (hasPermission) {
                            LyricUtil.showStatusBarLyric(
                                LyricManager.getCurrentLyric()?.lrc ??
                                    'MusicFree',
                                Config.get('setting.lyric') ?? {},
                            );
                            Config.set(
                                'setting.lyric.showStatusBarLyric',
                                true,
                            );
                        } else {
                            LyricUtil.requestSystemAlertPermission().finally(
                                () => {
                                    Toast.warn(
                                        '开启桌面歌词失败，无悬浮窗权限',
                                    );
                                },
                            );
                        }
                    } else {
                        LyricUtil.hideStatusBarLyric();
                        Config.set('setting.lyric.showStatusBarLyric', false);
                    }
                }}
                width={iconSizeConst.normal}
                height={iconSizeConst.normal}
                color={
                    lyricConfig?.showStatusBarLyric ? colors.primary : 'white'
                }
            />
            <TranslationIcon
                width={iconSizeConst.normal}
                height={iconSizeConst.normal}
                opacity={
                    !hasTranslation
                        ? 0.2
                        : lyricConfig?.showTranslation
                        ? 1
                        : 0.5
                }
                color={
                    lyricConfig?.showTranslation && hasTranslation
                        ? colors.primary
                        : 'white'
                }
                // style={}
                onPress={() => {
                    if (!hasTranslation) {
                        Toast.warn('当前歌曲无翻译');
                        return;
                    }
                    Config.set(
                        'setting.lyric.showTranslation',
                        !lyricConfig?.showTranslation,
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: rpx(80),
        marginBottom: rpx(24),
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
});
