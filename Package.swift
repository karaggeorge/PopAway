// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "popaway",
	platforms: [
		.macOS(.v13)
	],
  dependencies: [
		.package(url: "https://github.com/jakeheis/SwiftCLI", from: "6.0.0")
	],
	targets: [
		.target(
			name: "popaway",
			dependencies: [
				"SwiftCLI"
			]
		)
	]
)
