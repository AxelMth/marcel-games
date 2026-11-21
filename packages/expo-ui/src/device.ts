import type { KeyValueStore, LaunchDevice } from "@marcel-games/game-sync"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { randomUUID } from "expo-crypto"
import * as Device from "expo-device"
import * as SecureStore from "expo-secure-store"

export const deviceStore: KeyValueStore = AsyncStorage

// The iOS keychain outlasts an uninstall, AsyncStorage does not: a device id kept
// here is what lets a reinstalled game find its levels on the server again.
const KEYCHAIN = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }

export const identityStore: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key, KEYCHAIN),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, KEYCHAIN),
}

export function newDeviceId(): string {
  return randomUUID()
}

function deviceType(): LaunchDevice["deviceType"] {
  if (Device.deviceType === Device.DeviceType.PHONE) return "PHONE"
  if (Device.deviceType === Device.DeviceType.TABLET) return "TABLET"
  return "UNKNOWN"
}

export function launchDevice(): LaunchDevice {
  return {
    osName: Device.osName,
    osVersion: Device.osVersion,
    modelName: Device.modelName,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    deviceType: deviceType(),
    isDevice: Device.isDevice,
  }
}
