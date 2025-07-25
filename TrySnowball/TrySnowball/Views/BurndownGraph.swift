import SwiftUI

struct BurndownGraph: View {
    let debts: [WorkbookDebt]
    let extraPayment: Double
    
    @State private var animateProgress = false
    @State private var selectedPoint: DebtProjection?
    @State private var showingDetails = false
    @State private var editableExtraPayment: Double
    @State private var isEditing = false
    
    init(debts: [WorkbookDebt], extraPayment: Double) {
        self.debts = debts
        self.extraPayment = extraPayment
        self._editableExtraPayment = State(initialValue: extraPayment)
    }
    
    private var totalDebt: Double {
        debts.reduce(0) { $0 + $1.balance }
    }
    
    private var monthlyMinimums: Double {
        debts.reduce(0) { $0 + $1.minimumPayment }
    }
    
    // Calculate minimum payments trajectory (baseline)
    private var minimumPayoffData: [DebtProjection] {
        calculatePayoffTrajectory(extraPayment: 0)
    }
    
    // Calculate snowball trajectory (with extra payments)  
    private var snowballPayoffData: [DebtProjection] {
        calculatePayoffTrajectory(extraPayment: editableExtraPayment)
    }
    
    private func calculatePayoffTrajectory(extraPayment: Double) -> [DebtProjection] {
        guard !debts.isEmpty else { return [] }
        
        // Sort debts by balance (smallest first) - proper snowball method
        var remainingDebts = debts.sorted { $0.balance < $1.balance }.map { debt in
            DebtBalance(debt: debt, remaining: debt.balance)
        }
        
        let totalMinPayments = debts.reduce(0) { $0 + $1.minimumPayment }
        var availablePayment = totalMinPayments + extraPayment
        var projections: [DebtProjection] = []
        var month = 0
        
        while !remainingDebts.isEmpty && month < 120 {
            var totalBalance: Double = 0
            
            // Process each debt for this month
            for i in 0..<remainingDebts.count {
                let debt = remainingDebts[i]
                
                // Calculate monthly interest
                let monthlyInterest = (debt.debt.interestRate / 100 / 12) * debt.remaining
                
                // Determine payment for this debt
                var paymentToThisDebt = debt.debt.minimumPayment
                if i == 0 {
                    // First (smallest) debt gets all extra payment
                    paymentToThisDebt += (availablePayment - totalMinPayments)
                }
                
                // Apply payment (interest first, then principal)
                let principalPayment = max(0, paymentToThisDebt - monthlyInterest)
                remainingDebts[i].remaining = max(0, debt.remaining - principalPayment)
                
                totalBalance += remainingDebts[i].remaining
            }
            
            projections.append(DebtProjection(month: month, balance: totalBalance))
            
            // Remove paid-off debts and add their minimum payments to available funds
            let initialCount = remainingDebts.count
            let paidOffDebts = remainingDebts.filter { $0.remaining <= 0.01 }
            remainingDebts = remainingDebts.filter { $0.remaining > 0.01 }
            
            // Add minimum payments from paid-off debts to available payment (snowball effect)
            if remainingDebts.count < initialCount {
                for paidOffDebt in paidOffDebts {
                    availablePayment += paidOffDebt.debt.minimumPayment
                }
            }
            
            month += 1
            
            if totalBalance <= 0.01 {
                projections.append(DebtProjection(month: month, balance: 0))
                break
            }
        }
        
        return projections
    }
    
    // Use snowball data as primary for backward compatibility
    private var payoffData: [DebtProjection] {
        snowballPayoffData
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerView
            VStack(spacing: 0) {
                graphView
                dateLabelsView
            }
            extraPaymentControl
            legendView
            statsView
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
        .shadow(radius: 1)
        .onAppear {
            withAnimation(.easeOut(duration: 1.5)) {
                animateProgress = true
            }
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Your Burndown Progress")
                    .font(.headline)
                    .foregroundColor(.primary)
                Text("Visualise your journey to zero debt")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
    
    
    private var graphView: some View {
        GeometryReader { geometry in
            ZStack {
                backgroundGrid(in: geometry)
                yearMarkerLines(in: geometry)
                
                // Minimum payments line (baseline)
                minimumPaymentsPath(in: geometry)
                    .trim(from: 0, to: animateProgress ? 1 : 0)
                    .stroke(
                        Color.gray.opacity(0.5),
                        style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [5, 5])
                    )
                
                // Snowball payments line (enhanced) 
                snowballPath(in: geometry)
                    .trim(from: 0, to: animateProgress ? 1 : 0)
                    .stroke(
                        LinearGradient(
                            colors: [.blue, .mint],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                
                
                if animateProgress && !payoffData.isEmpty {
                    currentPositionDot(in: geometry)
                    finalPositionDot(in: geometry)
                }
            }
        }
        .frame(height: 200)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.blue.opacity(0.05),
                    Color.mint.opacity(0.05)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
        .onTapGesture { location in
            handleTap(at: location)
        }
        .overlay(
            // Tooltip for selected point
            selectedPointTooltip,
            alignment: .topTrailing
        )
    }
    
    private func backgroundGrid(in geometry: GeometryProxy) -> some View {
        Path { path in
            let width = geometry.size.width
            let height = geometry.size.height
            
            for i in 0...4 {
                let y = height * Double(i) / 4.0
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: width, y: y))
            }
            for i in 0...6 {
                let x = width * Double(i) / 6.0
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: height))
            }
        }
        .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
    }
    
    private func yearMarkerLines(in geometry: GeometryProxy) -> some View {
        let width = geometry.size.width
        let height = geometry.size.height
        let maxMonth = max(minimumPayoffData.last?.month ?? 1, snowballPayoffData.last?.month ?? 1)
        
        return Path { path in
            let years = Int(ceil(Double(maxMonth) / 12.0))
            if years > 1 {
                for year in 1..<years {
                    let yearMonth = year * 12
                    if yearMonth < maxMonth {
                        let x = width * Double(yearMonth) / Double(max(maxMonth, 1))
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: height))
                    }
                }
            }
        }
        .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
    }
    
    private func minimumPaymentsPath(in geometry: GeometryProxy) -> Path {
        createPath(for: minimumPayoffData, in: geometry)
    }
    
    private func snowballPath(in geometry: GeometryProxy) -> Path {
        createPath(for: snowballPayoffData, in: geometry)
    }
    
    // Keep the old method name for backward compatibility
    private func burndownPath(in geometry: GeometryProxy) -> Path {
        snowballPath(in: geometry)
    }
    
    
    private func createPath(for data: [DebtProjection], in geometry: GeometryProxy) -> Path {
        Path { path in
            guard !data.isEmpty else { return }
            
            let width = geometry.size.width
            let height = geometry.size.height
            
            // Use the longer timeline between minimum and snowball for consistent scale
            let maxMonth = max(minimumPayoffData.last?.month ?? 1, snowballPayoffData.last?.month ?? 1)
            let maxDebt = totalDebt
            
            for (index, projection) in data.enumerated() {
                let x = width * Double(projection.month) / Double(max(maxMonth, 1))
                let y = height * (1.0 - (projection.balance / max(maxDebt, 1)))
                
                if index == 0 {
                    path.move(to: CGPoint(x: x, y: y))
                } else {
                    path.addLine(to: CGPoint(x: x, y: y))
                }
            }
        }
    }
    
    private func currentPositionDot(in geometry: GeometryProxy) -> some View {
        let width = geometry.size.width
        let height = geometry.size.height
        let maxMonth = payoffData.last?.month ?? 1
        let maxDebt = totalDebt
        let currentProjection = payoffData.first ?? DebtProjection(month: 0, balance: totalDebt)
        
        let x = width * Double(currentProjection.month) / Double(max(maxMonth, 1))
        let y = height * (1.0 - (currentProjection.balance / max(maxDebt, 1)))
        
        return Circle()
            .fill(Color.blue)
            .frame(width: 10, height: 10)
            .position(x: x, y: y)
    }
    
    @ViewBuilder
    private func finalPositionDot(in geometry: GeometryProxy) -> some View {
        if let final = payoffData.last {
            let width = geometry.size.width
            let height = geometry.size.height
            let x = width * Double(final.month) / Double(max(final.month, 1))
            let y = height
            
            VStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 12, height: 12)
                    .overlay(Circle().stroke(Color.white, lineWidth: 2))
                    .position(x: x, y: y)
                Text("Debt Free")
                    .font(.caption2)
                    .foregroundColor(.green)
                    .position(x: x, y: y - 12)
            }
        } else {
            EmptyView()
        }
    }
    
    private var dateLabelsView: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let maxMonth = max(minimumPayoffData.last?.month ?? 1, snowballPayoffData.last?.month ?? 1)
            
            let calendar = Calendar.current
            let today = Date()
            
            HStack {
                // Start date (Today)
                VStack(spacing: 2) {
                    Text(DateFormatter.monthDay.string(from: today))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("Today")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Year markers in the middle
                if maxMonth > 12 {
                    let years = Int(ceil(Double(maxMonth) / 12.0))
                    ForEach(1..<years, id: \.self) { year in
                        let yearMonth = year * 12
                        if yearMonth < maxMonth {
                            let yearDate = calendar.date(byAdding: .month, value: yearMonth, to: today) ?? today
                            
                            VStack(spacing: 2) {
                                Text(DateFormatter.year.string(from: yearDate))
                                    .font(.caption2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.secondary)
                                Text(" ")
                                    .font(.caption2)
                            }
                        }
                    }
                }
                
                Spacer()
                
                // End date 
                if maxMonth > 0 {
                    let endDate = calendar.date(byAdding: .month, value: maxMonth, to: today) ?? today
                    
                    VStack(spacing: 2) {
                        Text(DateFormatter.monthDay.string(from: endDate))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("Debt-Free")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .frame(height: 35)
    }
    
    private var halfTimePayment: Double {
        let minimumOnlyMonths = minimumPayoffData.count > 1 ? minimumPayoffData.count - 1 : 0
        let targetMonths = max(1, minimumOnlyMonths / 2)
        
        // Binary search to find the extra payment needed for target months
        var low: Double = 0
        var high: Double = 2000
        var bestExtra: Double = 0
        
        while low <= high {
            let midExtra = (low + high) / 2
            let testMonths = calculatePayoffTrajectory(extraPayment: midExtra).count > 1 ? 
                calculatePayoffTrajectory(extraPayment: midExtra).count - 1 : 0
            
            if testMonths <= targetMonths {
                bestExtra = midExtra
                high = midExtra - 1
            } else {
                low = midExtra + 1
            }
        }
        
        return min(1000, bestExtra) // Cap at slider maximum
    }
    
    private var extraPaymentControl: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Additional Monthly Payment")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(editableExtraPayment.formatAsCurrency())
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }
            
            VStack(spacing: 8) {
                // Slider with special markers
                ZStack(alignment: .leading) {
                    // Background track
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    // Half-time marker
                    let halfTimePosition = halfTimePayment / 1000
                    Rectangle()
                        .fill(Color.orange)
                        .frame(width: 4, height: 16)
                        .cornerRadius(2)
                        .offset(x: halfTimePosition * (UIScreen.main.bounds.width - 80))
                    
                    // Active track
                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: (editableExtraPayment / 1000) * (UIScreen.main.bounds.width - 80), height: 8)
                        .cornerRadius(4)
                }
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            let newValue = max(0, min(1000, (value.location.x / (UIScreen.main.bounds.width - 80)) * 1000))
                            editableExtraPayment = newValue
                        }
                )
                
                // Slider control
                Slider(value: $editableExtraPayment, in: 0...1000, step: 10)
                    .accentColor(.blue)
                    .onChange(of: editableExtraPayment) { oldValue, newValue in
                        // Force graph update with animation
                        withAnimation(.easeInOut(duration: 0.3)) {
                            animateProgress = false
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            withAnimation(.easeOut(duration: 0.8)) {
                                animateProgress = true
                            }
                        }
                    }
                
                // Labels and half-time button
                HStack {
                    Text("£0")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Button("Half debt time: \(halfTimePayment.formatAsCurrency())") {
                        editableExtraPayment = halfTimePayment
                    }
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(6)
                    
                    Spacer()
                    
                    Text("£1000")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(16)
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
    
    private var legendView: some View {
        HStack(spacing: 20) {
            // Snowball line legend
            HStack(spacing: 6) {
                Rectangle()
                    .fill(LinearGradient(colors: [.blue, .mint], startPoint: .leading, endPoint: .trailing))
                    .frame(width: 20, height: 3)
                    .cornerRadius(1.5)
                
                Text("With Extra Payments")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Minimum payments legend
            HStack(spacing: 6) {
                Rectangle()
                    .fill(Color.gray.opacity(0.5))
                    .frame(width: 20, height: 2)
                    .overlay(
                        Rectangle()
                            .fill(Color.clear)
                            .frame(width: 20, height: 2)
                            .background(
                                Path { path in
                                    let dashLength: CGFloat = 2
                                    let gapLength: CGFloat = 2
                                    var x: CGFloat = 0
                                    while x < 20 {
                                        path.move(to: CGPoint(x: x, y: 1))
                                        path.addLine(to: CGPoint(x: min(x + dashLength, 20), y: 1))
                                        x += dashLength + gapLength
                                    }
                                }
                                .stroke(Color.gray.opacity(0.5), lineWidth: 2)
                            )
                    )
                
                Text("Minimum Only")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
    
    private var statsView: some View {
        HStack(spacing: 0) {
            statItem(title: "Total Debt", value: totalDebt.formatAsCurrency(), color: .blue)
            statItem(title: "Monthly Payment", value: (monthlyMinimums + editableExtraPayment).formatAsCurrency(), color: .mint)
            statItem(title: "Debt Free In", value: "\(snowballPayoffData.count > 1 ? snowballPayoffData.count - 1 : 0) months", color: .green)
        }
    }
    
    private func statItem(title: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
    
    private func handleTap(at location: CGPoint) {
        // Find closest point on graph to tap location
        guard !payoffData.isEmpty else { return }
        
        let graphWidth = 200.0 // Approximate frame width
        let maxMonth = payoffData.last?.month ?? 1
        let tapMonth = Int((location.x / graphWidth) * Double(maxMonth))
        
        // Find closest data point
        if let closestPoint = payoffData.min(by: { 
            abs($0.month - tapMonth) < abs($1.month - tapMonth) 
        }) {
            selectedPoint = closestPoint
            showingDetails = true
            
            // Auto-hide after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                withAnimation(.easeOut(duration: 0.3)) {
                    showingDetails = false
                }
            }
        }
    }
    
    @ViewBuilder
    private var selectedPointTooltip: some View {
        if let selected = selectedPoint, showingDetails {
            VStack(alignment: .leading, spacing: 4) {
                Text("Month \(selected.month)")
                    .font(.caption)
                    .fontWeight(.semibold)
                
                Text("\(selected.balance.formatAsCurrency()) remaining")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding(8)
            .background(Color.black.opacity(0.8))
            .foregroundColor(.white)
            .cornerRadius(8)
            .transition(.opacity.combined(with: .scale))
            .animation(.easeInOut(duration: 0.2), value: showingDetails)
        }
    }
}

struct DebtProjection {
    let month: Int
    let balance: Double
}

struct DebtBalance {
    let debt: WorkbookDebt
    var remaining: Double
}

extension DateFormatter {
    static let monthDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter
    }()
    
    static let monthYear: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM yy"
        return formatter
    }()
    
    static let year: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy"
        return formatter
    }()
}

#Preview {
    let sampleDebts = [
        WorkbookDebt(name: "Credit Card", balance: 2500, interestRate: 19.9, minimumPayment: 50),
        WorkbookDebt(name: "Loan", balance: 5000, interestRate: 8.5, minimumPayment: 150)
    ]
    return BurndownGraph(debts: sampleDebts, extraPayment: 200)
        .padding()
        .preferredColorScheme(.dark) // Preview dark mode explicitly
}
