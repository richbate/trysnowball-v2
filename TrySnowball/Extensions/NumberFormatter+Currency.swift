import Foundation

extension NumberFormatter {
    static let currency: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        formatter.groupingSeparator = ","
        formatter.usesGroupingSeparator = true
        return formatter
    }()
}

extension Double {
    func formatAsCurrency() -> String {
        guard let formatted = NumberFormatter.currency.string(from: NSNumber(value: self)) else {
            return "£\(Int(self))"
        }
        return "£\(formatted)"
    }
}

extension Int {
    func formatAsCurrency() -> String {
        guard let formatted = NumberFormatter.currency.string(from: NSNumber(value: self)) else {
            return "£\(self)"
        }
        return "£\(formatted)"
    }
}