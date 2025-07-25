import SwiftUI

struct LearnView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Learn from TrySnowball")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Helpful articles, resources, and updates from the TrySnowball team.")
                        .foregroundColor(.secondary)
                    
                    ForEach(0..<5) { index in
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color(.secondarySystemBackground))
                            .frame(height: 100)
                            .overlay(
                                Text("Article Placeholder \(index + 1)")
                                    .padding()
                                    .foregroundColor(.primary),
                                alignment: .leading
                            )
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Learn")
        }
    }
}
