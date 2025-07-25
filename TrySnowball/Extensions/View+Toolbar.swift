import SwiftUI

extension View {
    @ViewBuilder
    func debtToolbar(
        isValid: Bool = true,
        cancelAction: @escaping () -> Void,
        saveAction: @escaping () -> Void
    ) -> some View {
#if os(iOS)
        self.toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel", action: cancelAction)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save", action: saveAction)
                    .disabled(!isValid)
            }
        }
#else
        self.toolbar {
            ToolbarItem {
                HStack {
                    Button("Cancel", action: cancelAction)
                    Button("Save", action: saveAction)
                        .disabled(!isValid)
                }
            }
        }
#endif
    }
    
    @ViewBuilder
    func debtAddToolbar(addAction: @escaping () -> Void) -> some View {
#if os(iOS)
        self.toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add", action: addAction)
            }
        }
#else
        self.toolbar {
            ToolbarItem {
                Button("Add", action: addAction)
            }
        }
#endif
    }
}
