import SwiftUI

struct DebtListView: View {
    @EnvironmentObject var debtViewModel: DebtViewModel
    @EnvironmentObject var workbookService: WorkbookService
    @State private var showingAddDebt = false
    @State private var selectedDebt: WorkbookDebt?
    
    private var effectiveDebts: [WorkbookDebt] {
        if !workbookService.workbook.debts.isEmpty {
            return workbookService.workbook.debts
        } else {
            return debtViewModel.debts.map { WorkbookDebt(from: $0) }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if effectiveDebts.isEmpty {
                    emptyStateView
                } else {
                    debtsList
                }
            }
            .navigationTitle("My Debts")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Add") {
                        showingAddDebt = true
                    }
                }
            }
            .sheet(isPresented: $showingAddDebt) {
                AddDebtView(workbook: $workbookService.workbook)
            }
            .sheet(item: $selectedDebt) { debt in
                DebtDetailView(debt: debt)
            }
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "creditcard.and.123")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Debts Added")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add your first debt to start tracking your journey to financial freedom")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("Add Your First Debt") {
                showingAddDebt = true
            }
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(12)
        }
        .padding()
    }
    
    private var debtsList: some View {
        List {
            ForEach(effectiveDebts.sorted { $0.balance < $1.balance }, id: \.id) { debt in
                DebtListRow(debt: debt) {
                    selectedDebt = debt
                }
            }
            .onDelete(perform: deleteDebts)
        }
    }
    
    private func deleteDebts(offsets: IndexSet) {
        let sortedDebts = effectiveDebts.sorted { $0.balance < $1.balance }
        for index in offsets {
            let debtToDelete = sortedDebts[index]
            
            // Remove from workbook if it exists there
            if let workbookIndex = workbookService.workbook.debts.firstIndex(where: { $0.id == debtToDelete.id }) {
                workbookService.workbook.debts.remove(at: workbookIndex)
                workbookService.saveWorkbook()
            }
            
            // Also remove from debt view model if it exists there
            if let debtModelIndex = debtViewModel.debts.firstIndex(where: { $0.id == debtToDelete.id }) {
                debtViewModel.debts.remove(at: debtModelIndex)
            }
        }
    }
}

struct DebtListRow: View {
    let debt: WorkbookDebt
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Debt type icon
                Image(systemName: debt.creditorType.icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 30)
                
                // Debt details
                VStack(alignment: .leading, spacing: 4) {
                    Text(debt.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    HStack {
                        Text(debt.balance.formatAsCurrency())
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.red)
                        
                        Text("•")
                            .foregroundColor(.secondary)
                        
                        Text("\(debt.interestRate, specifier: "%.1f")% APR")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                    }
                    
                    // Payment info
                    HStack {
                        Text("Min: \(debt.minimumPayment.formatAsCurrency())")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let nextDue = debt.nextDueDate {
                            Text("•")
                                .foregroundColor(.secondary)
                            
                            Text("Due \(formatDueDate(nextDue))")
                                .font(.caption)
                                .foregroundColor(dueDateColor(nextDue))
                        }
                        
                        Spacer()
                    }
                }
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatDueDate(_ date: Date) -> String {
        let days = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? 0
        
        if days < 0 {
            return "overdue"
        } else if days == 0 {
            return "today"
        } else if days == 1 {
            return "tomorrow"
        } else if days <= 7 {
            return "in \(days)d"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return formatter.string(from: date)
        }
    }
    
    private func dueDateColor(_ date: Date) -> Color {
        let days = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? 0
        
        if days < 0 {
            return .red
        } else if days <= 3 {
            return .orange
        } else {
            return .secondary
        }
    }
}


#Preview {
    let sampleService = WorkbookService()
    sampleService.workbook.debts = [
        WorkbookDebt(
            name: "Barclaycard",
            balance: 2500,
            interestRate: 19.9,
            minimumPayment: 75,
            nextDueDate: Calendar.current.date(byAdding: .day, value: 3, to: Date())
        ),
        WorkbookDebt(
            name: "Personal Loan",
            balance: 8500,
            interestRate: 8.5,
            minimumPayment: 180,
            nextDueDate: Calendar.current.date(byAdding: .day, value: 12, to: Date())
        )
    ]
    
    return DebtListView()
        .environmentObject(DebtViewModel())
        .environmentObject(sampleService)
}