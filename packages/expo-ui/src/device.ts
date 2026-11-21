import type { KeyValueStore, LaunchDevice } from "@marcel-games/game-sync"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { randomUUID } from "expo-crypto"
import * as Device from "expo-device"

export const deviceStore: KeyValueStore = AsyncStorage

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
