// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.1.0"),
        .package(name: "CapacitorCommunityAdmob", path: "../../../../../node_modules/.pnpm/@capacitor-community+admob@8.0.0/node_modules/@capacitor-community/admob"),
        .package(name: "CapacitorDevice", path: "../../../../../node_modules/.pnpm/@capacitor+device@8.0.1_@capacitor+core@8.1.0/node_modules/@capacitor/device"),
        .package(name: "CapacitorLiveUpdates", path: "../../../../../node_modules/.pnpm/@capacitor+live-updates@0.5.0_@capacitor+core@8.1.0/node_modules/@capacitor/live-updates"),
        .package(name: "CapacitorPreferences", path: "../../../../../node_modules/.pnpm/@capacitor+preferences@8.0.1_@capacitor+core@8.1.0/node_modules/@capacitor/preferences"),
        .package(name: "CapacitorStatusBar", path: "../../../../../node_modules/.pnpm/@capacitor+status-bar@8.0.1_@capacitor+core@8.1.0/node_modules/@capacitor/status-bar"),
        .package(name: "CapacitorPluginAppTrackingTransparency", path: "../../../../../node_modules/.pnpm/capacitor-plugin-app-tracking-transparency@3.0.0_@capacitor+core@8.1.0/node_modules/capacitor-plugin-app-tracking-transparency")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityAdmob", package: "CapacitorCommunityAdmob"),
                .product(name: "CapacitorDevice", package: "CapacitorDevice"),
                .product(name: "CapacitorLiveUpdates", package: "CapacitorLiveUpdates"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar"),
                .product(name: "CapacitorPluginAppTrackingTransparency", package: "CapacitorPluginAppTrackingTransparency")
            ]
        )
    ]
)
