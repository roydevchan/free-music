import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import rpx from '@/utils/rpx';
import {Button, Dialog, Paragraph} from 'react-native-paper';
import useDialog from '../useDialog';
import useColors from '@/hooks/useColors';
import Color from 'color';

interface ISimpleDialogProps {
  visible: boolean;
  hideDialog: () => void;
  title: string;
  content: string;
  onOk?: () => void;
}
export default function SimpleDialog(props: ISimpleDialogProps) {
  const {visible, hideDialog, title, content, onOk} = props;
  const colors = useColors();
  return (
    <Dialog
      visible={visible}
      onDismiss={hideDialog}
      style={{backgroundColor: colors.primary}}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Paragraph>{content}</Paragraph>
      </Dialog.Content>
      <Dialog.Actions>
        <Button color={colors.text} onPress={hideDialog}>
          取消
        </Button>
        <Button
          color={colors.text}
          onPress={() => {
            onOk?.();
            hideDialog();
          }}>
          确认
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const style = StyleSheet.create({
  wrapper: {
    width: rpx(750),
  },
});
