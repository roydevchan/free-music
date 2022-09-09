import {pluginManager} from '@/core/pluginManager';
import {makeTag} from '@/utils/makeTag';
import {useEffect, useState} from 'react';

export default function useAlbumMusicList(albumItem: IAlbum.IAlbumItem | null) {
  const [musicList, setMusicList] = useState<IMusic.IMusicItem[] | null>(null);

  useEffect(() => {
    if (albumItem === null) {
      return;
    }
    const plugin = pluginManager.getPlugin(albumItem.platform);
    // todo: try
    plugin?.instance
      ?.getAlbumInfo?.(albumItem)
      ?.then(_ => {
        setMusicList(makeTag(_?.musicList ?? [], albumItem.platform));
      })
      ?.catch();
  }, []);
  return musicList;
}
