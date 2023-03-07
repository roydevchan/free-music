import React from 'react';
import {StatusBar, StatusBarProps, View} from 'react-native';
import useColors from '@/hooks/useColors';
import {sw} from '@/utils/rpx';

interface IStatusBarProps extends StatusBarProps {}

export default function (props: IStatusBarProps) {
    const colors = useColors();
    const {backgroundColor} = props;

    return (
        <View
            style={{
                zIndex: 10000,
                position: 'absolute',
                top: 0,
                backgroundColor: backgroundColor ?? colors.primary,
                width: sw(100),
                height: StatusBar.currentHeight,
            }}
        />
    );
}
