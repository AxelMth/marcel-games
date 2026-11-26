const { withAppBuildGradle } = require("expo/config-plugins")

// Credentials are read by Gradle at build time from the file named by
// ANDROID_KEYSTORE_PROPERTIES, so they never land in the generated android/ folder.
const loader = `
def releaseKeystorePropsPath = System.getenv("ANDROID_KEYSTORE_PROPERTIES")
def releaseKeystoreProps = new Properties()
if (releaseKeystorePropsPath) {
    file(releaseKeystorePropsPath).withInputStream { releaseKeystoreProps.load(it) }
}
`

const releaseConfig = `
        release {
            if (releaseKeystorePropsPath) {
                storeFile new File(file(releaseKeystorePropsPath).parentFile, releaseKeystoreProps["storeFile"])
                storePassword releaseKeystoreProps["storePassword"]
                keyAlias releaseKeystoreProps["keyAlias"]
                keyPassword releaseKeystoreProps["keyPassword"]
            }
        }`

const withAndroidReleaseSigning = (config) =>
  withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents
    if (gradle.includes("releaseKeystorePropsPath")) return config

    gradle = gradle.replace(/^android \{/m, `${loader}\nandroid {`)
    gradle = gradle.replace(/signingConfigs \{\n(\s+debug \{[\s\S]*?\n\s+\})/, (match) => match + releaseConfig)
    gradle = gradle.replace(
      /(release \{\n(?:\s+\/\/.*\n)*\s+)signingConfig signingConfigs\.debug/,
      "$1signingConfig releaseKeystorePropsPath ? signingConfigs.release : signingConfigs.debug",
    )
    if (!gradle.includes("signingConfigs.release :")) {
      throw new Error("with-android-release-signing: build.gradle template changed, release signing not applied")
    }
    config.modResults.contents = gradle
    return config
  })

module.exports = withAndroidReleaseSigning
