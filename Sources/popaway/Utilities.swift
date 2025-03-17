import Foundation

extension Data {
	func jsonDecoded<T: Decodable>() throws -> T {
		try JSONDecoder().decode(T.self, from: self)
	}
}

extension String {
	func jsonDecoded<T: Decodable>() throws -> T {
		try data(using: .utf8)!.jsonDecoded()
	}
}

func toJson<T>(_ data: T) throws -> String {
	let json = try JSONSerialization.data(withJSONObject: data)
	return String(data: json, encoding: .utf8)!
}
// MARK: -
