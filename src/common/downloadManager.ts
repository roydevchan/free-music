import {internalKey} from '@/constants/commonConst';
import pathConst from '@/constants/pathConst';
import {checkAndCreateDir} from '@/utils/fileUtils';
import isSameMusicItem from '@/utils/isSameMusicItem';
import StateMapper from '@/utils/stateMapper';
import {getStorage, setStorage} from '@/utils/storageUtil';
import deepmerge from 'deepmerge';
import produce from 'immer';
import {useEffect, useState} from 'react';
import {
  exists,
  unlink,
  mkdir,
  downloadFile,
  readDir,
  read,
  readFile,
} from 'react-native-fs';
import Toast from 'react-native-toast-message';
import {pluginManager} from './pluginManager';

interface IDownloadMusicOptions {
  musicItem: IMusic.IMusicItem;
  filename: string;
  jobId?: number;
}
// todo： 直接把下载信息写在meta里面就好了
/** 已下载 */
let downloadedMusic: IMusic.IMusicItem[] = [];
/** 下载中 */
let downloadingMusicQueue: IDownloadMusicOptions[] = [];
/** 队列中 */
let pendingMusicQueue: IDownloadMusicOptions[] = [];
/** meta */
let downloadedData: Record<string, IMusic.IMusicItem> = {};
/** 进度 */
let downloadingProgress: Record<string, {progress: number; size: number}> = {};

const downloadedStateMapper = new StateMapper(() => downloadedMusic);
const downloadingQueueStateMapper = new StateMapper(
  () => downloadingMusicQueue,
);
const pendingMusicQueueStateMapper = new StateMapper(() => pendingMusicQueue);
const downloadingProgressStateMapper = new StateMapper(
  () => downloadingProgress,
);

/** 从待下载中移除 */
function removeFromPendingQueue(item: IDownloadMusicOptions) {
  pendingMusicQueue = pendingMusicQueue.filter(
    _ => !isSameMusicItem(_.musicItem, item.musicItem),
  );
  pendingMusicQueueStateMapper.notify();
}

/** 从下载中队列移除 */
function removeFromDownloadingQueue(item: IDownloadMusicOptions) {
  downloadingMusicQueue = downloadingMusicQueue.filter(
    _ => !isSameMusicItem(_.musicItem, item.musicItem),
  );
  downloadingQueueStateMapper.notify();
}

/** 防止高频同步 */
let progressNotifyTimer: any = null;
function startNotifyProgress() {
  if (progressNotifyTimer) {
    return;
  }

  progressNotifyTimer = setTimeout(() => {
    progressNotifyTimer = null;
    downloadingProgressStateMapper.notify();
    startNotifyProgress();
  }, 400);
}

function stopNotifyProgress() {
  if (progressNotifyTimer) {
    clearInterval(progressNotifyTimer);
  }
  progressNotifyTimer = null;
}

/** 根据文件名解析 */
function parseFilename(fn: string): IMusic.IMusicItemBase | null {
  const data = fn.slice(0, fn.lastIndexOf('.')).split('@');
  const [platform, id, title, artist] = data;
  if (!platform || !id) {
    return null;
  }
  return {
    id,
    platform,
    title,
    artist,
  };
}

/** 生成下载文件名 */
function generateFilename(musicItem: IMusic.IMusicItem) {
  return (
    `${musicItem.platform}@${musicItem.id}@${musicItem.title}@${musicItem.artist}`.slice(
      0,
      200,
    ) + '.mp3'
  );
}

/** 可以配置一个说明文件 */
async function loadLocalJson(dirBase: string) {
  const jsonPath = dirBase + 'data.json';
  if (await exists(jsonPath)) {
    try {
      const result = await readFile(jsonPath, 'utf8');
      return JSON.parse(result);
    } catch {
      return {};
    }
  }
  return {};
}

/** 初始化 */
async function setupDownload() {
  await checkAndCreateDir(pathConst.downloadPath);
  const jsonData = await loadLocalJson(pathConst.downloadPath);
  downloadedData = deepmerge(
    (await getStorage('download-music')) ?? {},
    jsonData,
  );
  const newDownloadedData: Record<string, IMusic.IMusicItem> = {};
  const downloads = await readDir(pathConst.downloadPath);
  downloadedMusic = [];

  for (let i = 0; i < downloads.length; ++i) {
    const data = parseFilename(downloads[i].name);
    if (data) {
      const key = `${data.platform}${data.id}`;
      const mi = downloadedData[key] ?? {...data};
      mi[internalKey] = {
        localPath: downloads[i].path,
      };
      downloadedMusic.push(mi);
      newDownloadedData[key] = mi;
    }
  }
  downloadedStateMapper.notify();
  // 去掉冗余数据
  setStorage('download-music', newDownloadedData);
}

/** 从队列取出下一个要下载的 */
async function downloadNext() {
  // todo 最大同时下载3个，可设置
  if (downloadingMusicQueue.length >= 3 || pendingMusicQueue.length === 0) {
    return;
  }
  const nextItem = pendingMusicQueue[0];
  const musicItem = nextItem.musicItem;
  let url = musicItem.url;
  let headers = musicItem.headers;
  removeFromPendingQueue(nextItem);
  downloadingMusicQueue = produce(downloadingMusicQueue, draft => {
    draft.push(nextItem);
  });
  downloadingQueueStateMapper.notify();
  if (!url || !url?.startsWith('http')) {
    // 插件播放
    const plugin = pluginManager.getPlugin(musicItem.platform);
    if (plugin && plugin.instance.getMusicTrack) {
      try {
        // todo: 重试
        const data = await plugin.instance.getMusicTrack(musicItem);
        url = data?.url;
        headers = data?.headers;
      } catch {
        /** 无法下载，跳过 */
        removeFromDownloadingQueue(nextItem);
        return;
      }
    }
  }

  downloadNext();
  const {promise, jobId} = downloadFile({
    fromUrl: url ?? '',
    toFile: pathConst.downloadPath + nextItem.filename,
    headers: headers,
    background: true,
    begin(res) {
      downloadingProgress = produce(downloadingProgress, _ => {
        _[nextItem.filename] = {
          progress: 0,
          size: res.contentLength,
        };
      });
      startNotifyProgress();
    },
    progress(res) {
      downloadingProgress = produce(downloadingProgress, _ => {
        _[nextItem.filename] = {
          progress: res.bytesWritten,
          size: res.contentLength,
        };
      });
    },
  });
  nextItem.jobId = jobId;
  try {
    await promise;
    // 下载完成
    downloadedMusic = produce(downloadedMusic, _ => {
      if (
        downloadedMusic.findIndex(_ => isSameMusicItem(musicItem, _)) === -1
      ) {
        _.push({
          ...musicItem,
          [internalKey]: {
            localPath: pathConst.downloadPath + nextItem.filename,
          },
        });
      }
      return _;
    });
    removeFromDownloadingQueue(nextItem);
    downloadedData[`${musicItem.platform}${musicItem.id}`] = musicItem;
    setStorage('download-music', downloadedData);
    if (downloadingMusicQueue.length === 0) {
      stopNotifyProgress();
      Toast.show({
        text1: '下载完成',
        position: 'bottom',
      });
      downloadingMusicQueue = [];
      pendingMusicQueue = [];
      downloadingQueueStateMapper.notify();
      pendingMusicQueueStateMapper.notify();
    }
    delete downloadingProgress[nextItem.filename];
    downloadedStateMapper.notify();
    downloadNext();
  } catch {
    downloadingMusicQueue = produce(downloadingMusicQueue, _ =>
      _.filter(item => !isSameMusicItem(item.musicItem, musicItem)),
    );
  }
}

/** 下载音乐 */
function downloadMusic(musicItems: IMusic.IMusicItem | IMusic.IMusicItem[]) {
  // 如果已经在下载中
  if (!Array.isArray(musicItems)) {
    musicItems = [musicItems];
  }
  musicItems = musicItems.filter(
    musicItem =>
      pendingMusicQueue.findIndex(_ =>
        isSameMusicItem(_.musicItem, musicItem),
      ) === -1 &&
      downloadingMusicQueue.findIndex(_ =>
        isSameMusicItem(_.musicItem, musicItem),
      ) === -1,
  );
  const enqueueData = musicItems.map(_ => ({
    musicItem: _,
    filename: generateFilename(_),
  }));
  if (enqueueData.length) {
    pendingMusicQueue = pendingMusicQueue.concat(enqueueData);
    pendingMusicQueueStateMapper.notify();
    downloadNext();
  }
}

/** 是否下载 */
function isDownloaded(mi: IMusic.IMusicItem | null) {
  return mi
    ? downloadedMusic.findIndex(_ => isSameMusicItem(_, mi)) !== -1
    : false;
}

/** 获取下载的音乐 */
function getDownloaded(mi: IMusic.IMusicItem | null) {
  return mi ? downloadedMusic.find(_ => isSameMusicItem(_, mi)) : null;
}

/** 移除下载的文件 */
async function removeDownloaded(mi: IMusic.IMusicItem) {
  const localPath = getDownloaded(mi)?.[internalKey]?.localPath;
  if (localPath) {
    await unlink(localPath);
    downloadedMusic = downloadedMusic.filter(_ => !isSameMusicItem(_, mi));
    downloadedStateMapper.notify();
  }
}

/** 某个音乐是否被下载-状态 */
function useIsDownloaded(mi: IMusic.IMusicItem | null) {
  if (!mi) {
    return false;
  }
  const downloadedMusicState = downloadedStateMapper.useMappedState();
  const [downloaded, setDownloaded] = useState<boolean>(isDownloaded(mi));
  useEffect(() => {
    setDownloaded(
      downloadedMusicState.findIndex(_ => isSameMusicItem(mi, _)) !== -1,
    );
  }, [downloadedMusicState, mi]);
  return downloaded;
}

const DownloadManager = {
  downloadMusic,
  setupDownload,
  useDownloadedMusic: downloadedStateMapper.useMappedState,
  useDownloadingMusic: downloadingQueueStateMapper.useMappedState,
  usePendingMusic: pendingMusicQueueStateMapper.useMappedState,
  useDownloadingProgress: downloadingProgressStateMapper.useMappedState,
  isDownloaded,
  useIsDownloaded,
  getDownloaded,
  removeDownloaded,
};

export default DownloadManager;
