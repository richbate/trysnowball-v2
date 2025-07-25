import SwiftUI

struct DebtDetailView: View {
    @EnvironmentObject var workbookService: WorkbookService
    @Environment(\.presentationMode) var presentationMode
    
    @State private var debt: WorkbookDebt
    @State private var isEditing = false
    @State private var showingDatePicker = false
    
    // Editable fields
    @State private var editingName: String
    @State private var editingBalance: String
    @State private var editingInterestRate: String
    @State private var editingMinimumPayment: String
    @State private var editingDueDate: Date
    @State private var editingFrequency: PaymentFrequency
    
    init(debt: WorkbookDebt) {
        self._debt = State(initialValue: debt)
        self._editingName = State(initialValue: debt.name)
        self._editingBalance = State(initialValue: String(format: "%.0f", debt.balance))
        self._editingInterestRate = State(initialValue: String(format: "%.1f", debt.interestRate))
        self._editingMinimumPayment = State(initialValue: String(format: "%.0f", debt.minimumPayment))
        self._editingDueDate = State(initialValue: debt.nextDueDate ?? Date())
        self._editingFrequency = State(initialValue: debt.paymentFrequency)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    headerSection
                    detailsSection
                    paymentSection
                    actionsSection
                    Spacer(minLength: 20)
                }
                .padding()
            }
            .navigationTitle(debt.name)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isEditing ? "Done" : "Edit") {
                        if isEditing {
                            saveChanges()
                        }
                        withAnimation {
                            isEditing.toggle()
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: debt.creditorType.icon)
                    .font(.system(size: 40))
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    if isEditing {
                        TextField("Debt name", text: $editingName)
                            .font(.title2)
                            .fontWeight(.bold)
                    } else {
                        Text(debt.name)
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Text(debt.creditorType.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
    }
    
    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Debt Details")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                detailRow(
                    title: "Current Balance",
                    value: isEditing ? nil : debt.balance.formatAsCurrency(),
                    editField: isEditing ? 
                        AnyView(
                            TextField("Balance", text: $editingBalance)
                                .keyboardType(.numberPad)
                        ) : nil,
                    icon: "creditcard.fill",
                    color: .red
                )
                
                detailRow(
                    title: "Interest Rate", 
                    value: isEditing ? nil : String(format: "%.1f%%", debt.interestRate),
                    editField: isEditing ?
                        AnyView(
                            TextField("Rate", text: $editingInterestRate)
                                .keyboardType(.decimalPad)
                        ) : nil,
                    icon: "percent",
                    color: .orange
                )
                
                detailRow(
                    title: "Minimum Payment",
                    value: isEditing ? nil : debt.minimumPayment.formatAsCurrency(),
                    editField: isEditing ?
                        AnyView(
                            TextField("Minimum", text: $editingMinimumPayment)
                                .keyboardType(.numberPad)
                        ) : nil,
                    icon: "calendar",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
    }
    
    private var paymentSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Payment Schedule")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                // Next Due Date
                HStack {
                    Image(systemName: "calendar.circle.fill")
                        .foregroundColor(.mint)
                        .font(.title3)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Next Payment Due")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        if isEditing {
                            Button(action: { showingDatePicker = true }) {
                                Text(formatDate(editingDueDate))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } else if let dueDate = debt.nextDueDate {
                            Text(formatDate(dueDate))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else {
                            Text("Not set")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    if let dueDate = debt.nextDueDate {
                        Text(daysUntilDue(dueDate))
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(daysUntilColor(dueDate))
                    }
                }
                
                // Payment Frequency
                HStack {
                    Image(systemName: "repeat.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title3)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Payment Frequency")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        if isEditing {
                            Picker("Frequency", selection: $editingFrequency) {
                                ForEach(PaymentFrequency.allCases, id: \.self) { freq in
                                    Text(freq.rawValue).tag(freq)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                        } else {
                            Text(debt.paymentFrequency.rawValue)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
        .sheet(isPresented: $showingDatePicker) {
            NavigationView {
                DatePicker("Next Due Date", selection: $editingDueDate, displayedComponents: .date)
                    .datePickerStyle(WheelDatePickerStyle())
                    .navigationTitle("Due Date")
                    .navigationBarItems(trailing: Button("Done") {
                        showingDatePicker = false
                    })
            }
        }
    }
    
    private var actionsSection: some View {
        VStack(spacing: 12) {
            // Mark as Paid Button
            Button(action: markAsPaid) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Mark Payment Made")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.mint)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            
            // Pay Extra Button
            Button(action: payExtra) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Make Extra Payment")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
        }
    }
    
    private func detailRow(title: String, value: String?, editField: AnyView?, icon: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let editField = editField {
                    editField
                } else if let value = value {
                    Text(value)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    private func daysUntilDue(_ dueDate: Date) -> String {
        let days = Calendar.current.dateComponents([.day], from: Date(), to: dueDate).day ?? 0
        if days < 0 {
            return "Overdue"
        } else if days == 0 {
            return "Due today"
        } else if days == 1 {
            return "Due tomorrow"
        } else {
            return "Due in \(days) days"
        }
    }
    
    private func daysUntilColor(_ dueDate: Date) -> Color {
        let days = Calendar.current.dateComponents([.day], from: Date(), to: dueDate).day ?? 0
        if days < 0 {
            return .red
        } else if days <= 3 {
            return .orange
        } else {
            return .mint
        }
    }
    
    private func saveChanges() {
        // Validate and save changes
        guard let balance = Double(editingBalance),
              let rate = Double(editingInterestRate),
              let minPayment = Double(editingMinimumPayment) else {
            return
        }
        
        // Update debt in workbook
        if let index = workbookService.workbook.debts.firstIndex(where: { $0.id == debt.id }) {
            workbookService.workbook.debts[index].name = editingName
            workbookService.workbook.debts[index].balance = balance
            workbookService.workbook.debts[index].interestRate = rate
            workbookService.workbook.debts[index].minimumPayment = minPayment
            workbookService.workbook.debts[index].nextDueDate = editingDueDate
            workbookService.workbook.debts[index].paymentFrequency = editingFrequency
            
            debt = workbookService.workbook.debts[index]
            workbookService.saveWorkbook()
        }
    }
    
    private func markAsPaid() {
        if let index = workbookService.workbook.debts.firstIndex(where: { $0.id == debt.id }) {
            workbookService.workbook.debts[index].lastPaymentDate = Date()
            
            // Calculate next due date
            if let currentDue = debt.nextDueDate {
                let calendar = Calendar.current
                let nextDue = calendar.date(byAdding: .day, value: debt.paymentFrequency.daysInterval, to: currentDue)
                workbookService.workbook.debts[index].nextDueDate = nextDue
            }
            
            debt = workbookService.workbook.debts[index]
            workbookService.saveWorkbook()
        }
    }
    
    private func payExtra() {
        // This could open a sheet for entering extra payment amount
        // For now, just mark as paid
        markAsPaid()
    }
}

#Preview {
    let sampleDebt = WorkbookDebt(
        name: "Barclaycard",
        balance: 2500,
        interestRate: 19.9,
        minimumPayment: 75,
        nextDueDate: Calendar.current.date(byAdding: .day, value: 5, to: Date())
    )
    
    let sampleService = WorkbookService()
    sampleService.workbook.debts = [sampleDebt]
    
    return DebtDetailView(debt: sampleDebt)
        .environmentObject(sampleService)
}