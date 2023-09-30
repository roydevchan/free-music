import React from 'react';
import {Keyboard, StyleSheet} from 'react-native';
import rpx from '@/utils/rpx';
import {useNavigation} from '@react-navigation/native';
import {useAtom, useSetAtom} from 'jotai';
import {
    pageStatusAtom,
    PageStatus,
    queryAtom,
    searchResultsAtom,
    initSearchResults,
} from '../store/atoms';
import useSearch from '../hooks/useSearch';
import {Appbar, Searchbar} from 'react-native-paper';
import {addHistory} from '../common/historySearch';
import {fontSizeConst} from '@/constants/uiConst';
import useColors from '@/hooks/useColors';
import Button from '@/components/base/button';

export default function NavBar() {
    const navigation = useNavigation();
    const search = useSearch();
    const [query, setQuery] = useAtom(queryAtom);
    const setPageStatus = useSetAtom(pageStatusAtom);
    const colors = useColors();
    const setSearchResultsState = useSetAtom(searchResultsAtom);

    const onSearchSubmit = async () => {
        if (query === '') {
            return;
        }
        setSearchResultsState(initSearchResults);
        setPageStatus(prev =>
            prev === PageStatus.EDITING ? PageStatus.SEARCHING : prev,
        );
        await search(query, 1);
        await addHistory(query);
    };

    return (
        <Appbar style={[style.appbar, {backgroundColor: colors.primary}]}>
            <Appbar.BackAction
                onPress={() => {
                    // !!这个组件有bug，输入法拉起的时候返回会默认打开panel
                    Keyboard.dismiss();
                    navigation.goBack();
                }}
            />
            <Searchbar
                autoFocus
                inputStyle={style.input}
                style={style.searchBar}
                accessible
                accessibilityLabel="搜索框"
                accessibilityHint={'输入要搜索的歌曲'}
                onFocus={() => {
                    setPageStatus(PageStatus.EDITING);
                }}
                placeholder="输入要搜索的歌曲"
                onSubmitEditing={onSearchSubmit}
                onChangeText={_ => {
                    if (_ === '') {
                        setPageStatus(PageStatus.EDITING);
                    }
                    setQuery(_);
                }}
                value={query}
            />
            <Button style={style.button} onPress={onSearchSubmit}>
                搜索
            </Button>
        </Appbar>
    );
}

const style = StyleSheet.create({
    appbar: {
        shadowColor: 'transparent',
    },
    button: {
        paddingHorizontal: rpx(24),
    },
    searchBar: {
        minWidth: rpx(375),
        flex: 1,
        borderRadius: rpx(64),
        height: '72%',
        maxHeight: rpx(64),
        color: '#666666',
        alignItems: 'center',
    },
    input: {
        padding: 0,
        height: '100%',
        color: '#666666',
        fontSize: fontSizeConst.subTitle,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
