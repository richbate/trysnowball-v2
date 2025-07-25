import SwiftUI

#if os(iOS)
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#else
struct ShareSheet: View {
    let items: [Any]
    
    var body: some View {
        VStack {
            Text("Export functionality not available on macOS")
                .foregroundColor(.secondary)
            Text("File saved to Downloads folder")
                .font(.caption)
        }
        .padding()
    }
}
#endif
