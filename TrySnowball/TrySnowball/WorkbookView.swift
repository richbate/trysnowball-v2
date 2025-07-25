import SwiftUI

struct WorkbookView: View {
    @EnvironmentObject var workbookService: WorkbookService
    @EnvironmentObject var debtViewModel: DebtViewModel
    @State private var showingExport = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Workbook Manager")
                    .font(.title)
                    .fontWeight(.bold)
                
                VStack {
                    Text("Debts: \(workbookService.workbook.debts.count)")
                    if !workbookService.workbook.debts.isEmpty {
                        Text("Total: \(workbookService.workbook.debts.reduce(0) { $0 + $1.balance }.formatAsCurrency())")
                            .foregroundColor(.red)
                    }
                }
                
                Button("Export Workbook") {
                    showingExport = true
                }
                .buttonStyle(.borderedProminent)
                
                Button("Sync with Current Debts") {
                    syncWorkbookWithDebts()
                }
                .buttonStyle(.bordered)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Workbook")
            .sheet(isPresented: $showingExport) {
                ShareSheet(items: exportWorkbook())
            }
        }
    }
    
    private func syncWorkbookWithDebts() {
        workbookService.workbook.debts = debtViewModel.debts.map { debt in
            WorkbookDebt(name: debt.name, balance: debt.balance, interestRate: debt.interestRate, minimumPayment: debt.minimumPayment)
        }
        workbookService.saveWorkbook()
    }
    
    private func exportWorkbook() -> [Any] {
        guard let data = workbookService.exportWorkbook() else { return [] }
        let filename = "TrySnowball-Workbook.json"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: tempURL)
            return [tempURL]
        } catch {
            return []
        }
    }
}
