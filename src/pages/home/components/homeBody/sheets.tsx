import React, {useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import rpx from '@/utils/rpx';
import ThemeText from '@/components/base/themeText';
import useColors from '@/hooks/useColors';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import MusicSheet from '@/core/musicSheet';
import {FlashList} from '@shopify/flash-list';
import ListItem from '@/components/base/listItem';
import {ROUTE_PATH, useNavigate} from '@/entry/router';
import {ImgAsset} from '@/constants/assetsConst';
import {showDialog} from '@/components/dialogs/useDialog';
import Toast from '@/utils/toast';
import Empty from '@/components/base/empty';
import IconButton from '@/components/base/iconButton';
import {showPanel} from '@/components/panels/usePanel';
import {localPluginPlatform} from '@/constants/commonConst';

export default function Sheets() {
    const [index, setIndex] = useState(0);
    const colors = useColors();
    const navigate = useNavigate();

    const allSheets = MusicSheet.useSheets();
    const staredSheets = MusicSheet.useStarredMusicSheet();

    const selectedTabTextStyle = useMemo(() => {
        return [
            styles.selectTabText,
            {
                borderBottomColor: colors.primary,
            },
        ];
    }, [colors]);

    return (
        <>
            <View style={styles.subTitleContainer}>
                <TouchableWithoutFeedback
                    style={styles.tabContainer}
                    onPress={() => {
                        setIndex(0);
                    }}>
                    <ThemeText
                        fontSize="title"
                        style={[
                            styles.tabText,
                            index === 0 ? selectedTabTextStyle : null,
                        ]}>
                        我的歌单
                    </ThemeText>
                    <ThemeText
                        fontColor="textSecondary"
                        fontSize="subTitle"
                        style={styles.tabText}>
                        {' '}
                        ({allSheets.length})
                    </ThemeText>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback
                    style={styles.tabContainer}
                    onPress={() => {
                        setIndex(1);
                    }}>
                    <ThemeText
                        fontSize="title"
                        style={[
                            styles.tabText,
                            index === 1 ? selectedTabTextStyle : null,
                        ]}>
                        收藏歌单
                    </ThemeText>
                    <ThemeText
                        fontColor="textSecondary"
                        fontSize="subTitle"
                        style={styles.tabText}>
                        {' '}
                        ({staredSheets.length})
                    </ThemeText>
                </TouchableWithoutFeedback>
                <View style={styles.more}>
                    <IconButton
                        name="plus"
                        sizeType="normal"
                        accessibilityLabel="新建歌单"
                        onPress={() => {
                            showPanel('NewMusicSheet');
                        }}
                    />
                </View>
            </View>
            <FlashList
                ListEmptyComponent={<Empty />}
                data={(index === 0 ? allSheets : staredSheets) ?? []}
                estimatedItemSize={ListItem.Size.big}
                renderItem={({item: sheet}) => {
                    const isLocalSheet = !(
                        sheet.platform && sheet.platform !== localPluginPlatform
                    );

                    return (
                        <ListItem
                            key={`${sheet.id}`}
                            heightType="big"
                            withHorizonalPadding
                            onPress={() => {
                                if (isLocalSheet) {
                                    navigate(ROUTE_PATH.LOCAL_SHEET_DETAIL, {
                                        id: sheet.id,
                                    });
                                } else {
                                    navigate(ROUTE_PATH.PLUGIN_SHEET_DETAIL, {
                                        sheetInfo: sheet,
                                    });
                                }
                            }}>
                            <ListItem.ListItemImage
                                uri={sheet.coverImg ?? sheet.artwork}
                                fallbackImg={ImgAsset.albumDefault}
                                maskIcon={
                                    sheet.id === MusicSheet.defaultSheet.id
                                        ? 'heart'
                                        : null
                                }
                            />
                            <ListItem.Content
                                title={sheet.title}
                                description={
                                    isLocalSheet
                                        ? `${sheet.musicList?.length ?? '-'}首`
                                        : `${sheet.artist}`
                                }
                            />
                            <ListItem.ListItemIcon
                                position="right"
                                icon="trash-can-outline"
                                onPress={() => {
                                    showDialog('SimpleDialog', {
                                        title: '删除歌单',
                                        content: `确定删除歌单「${sheet.title}」吗?`,
                                        onOk: async () => {
                                            if (isLocalSheet) {
                                                await MusicSheet.removeSheet(
                                                    sheet.id,
                                                );
                                                Toast.success('已删除');
                                            } else {
                                                await MusicSheet.unstarMusicSheet(
                                                    sheet,
                                                );
                                                Toast.success('已取消收藏');
                                            }
                                        },
                                    });
                                }}
                            />
                        </ListItem>
                    );
                }}
                nestedScrollEnabled
            />
        </>
    );
}

const styles = StyleSheet.create({
    subTitleContainer: {
        paddingHorizontal: rpx(24),
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: rpx(12),
    },
    subTitleLeft: {
        flexDirection: 'row',
    },
    tabContainer: {
        flexDirection: 'row',
        marginRight: rpx(32),
    },

    tabText: {
        lineHeight: rpx(64),
    },
    selectTabText: {
        borderBottomWidth: rpx(6),
        fontWeight: 'bold',
    },
    more: {
        height: rpx(64),
        marginTop: rpx(3),
        flexGrow: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
