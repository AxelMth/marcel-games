import { MMKVLoader, useMMKVStorage } from 'react-native-mmkv-storage';

const storage = new MMKVLoader().initialize();

export function useStorageForKey<T>(key: string, defaultValue: T) {
  return useMMKVStorage(key, storage, defaultValue);
}
