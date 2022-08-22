import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import rpx from '@/utils/rpx';
import Loading from '@/components/loading';
import {Chip, useTheme} from 'react-native-paper';
import useSearch from '../hooks/useSearch';
import {addHistory, getHistory, removeHistory} from '../common/historySearch';
import {useSetAtom} from 'jotai';
import {
  PageStatus,
  pageStatusAtom,
  queryAtom,
  searchResultsAtom,
} from '../store/atoms';
import {fontSizeConst, fontWeightConst} from '@/constants/uiConst';

interface IProps {}
export default function (props: IProps) {
  const [history, setHistory] = useState<string[] | null>(null);
  const search = useSearch();

  const setQuery = useSetAtom(queryAtom);
  const setPageStatus = useSetAtom(pageStatusAtom);
  const setSearchResultsState = useSetAtom(searchResultsAtom);
  const {colors} = useTheme();

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  return (
    <View style={style.wrapper}>
      {history === null ? (
        <Loading></Loading>
      ) : (
        <>
          <Text style={[style.title, {color: colors.text}]}>历史记录</Text>
          {history.map(_ => (
            <Chip
              key={`search-history-${_}`}
              style={style.chip}
              onClose={async () => {
                await removeHistory(_);
                getHistory().then(setHistory);
              }}
              onPress={() => {
                search(_, 'all');
                addHistory(_);
                setPageStatus(PageStatus.SEARCHING);
                setSearchResultsState({});
                setQuery(_);
              }}>
              {_}
            </Chip>
          ))}
        </>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  wrapper: {
    width: rpx(750),
    maxWidth: rpx(750),
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: rpx(24),
  },
  title: {
    width: '100%',
    marginBottom: rpx(28),
    fontSize: fontSizeConst.normal,
    fontWeight: fontWeightConst.bold,
  },
  chip: {
    flexGrow: 0,
    marginRight: rpx(24),
    marginBottom: rpx(24),
  },
});
