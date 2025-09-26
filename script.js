document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = {
        isAuthenticated: false,
        currentUser: null, // { email, name }
        transactionsByUser: {
             // "demo.user@example.com": [ ...transactions ]
        },
        // Demo data will be populated if it doesn't exist for the demo user
    };

    const RATE_SHEETS = {
        "Walk-ins": [
            { type: "PET Clear", price: 3.1 }, { type: "PET Green", price: 2.0 },
            { type: "PET Brown", price: 1.8 }, { type: "C-oil", price: 1.3 },
            { type: "HDPE", price: 1.5 }, { type: "Tins", price: 1.0 },
            { type: "Cans", price: 15.5 }, { type: "C-plastic", price: 1.7 },
            { type: "M-plastic", price: 1.5 }, { type: "W-paper", price: 1.0 },
            { type: "K4", price: 0.8 }, { type: "TetraPak", price: 0.5 },
            { type: "PP", price: 0.2 }, { type: "Glass bottles", price: 0.2 }
        ],
        "CCT": [
            { type: "PET Clear", price: 2.6 }, { type: "PET Green", price: 1.5 },
            { type: "PET Brown", price: 1.3 }, { type: "K4", price: 0.5 },
            { type: "C-Plastic", price: 1.5 }, { type: "M-Plastic", price: 1.3 },
            { type: "Cans", price: 15.5 }, { type: "HDPE", price: 1.3 },
            { type: "C-oil", price: 1.0 }
        ]
    };
    
    const DEMO_TRANSACTIONS = [
      { id: '1', repName: 'Demo User', clientName: 'Local Cafe', material: 'Cans', weight: 15.5, pricePerKg: 15.5, total: 240.25, date: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: '2', repName: 'Demo User', clientName: 'Corner Store', material: 'PET Clear', weight: 25.2, pricePerKg: 3.1, total: 78.12, date: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: '3', repName: 'Demo User', clientName: 'City Supermarket', material: 'K4', weight: 120.0, pricePerKg: 0.8, total: 96.00, date: new Date().toISOString() },
      { id: '4', repName: 'Demo User', clientName: 'Local Resident', material: 'Glass bottles', weight: 50.7, pricePerKg: 0.2, total: 10.14, date: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: '5', repName: 'Demo User', clientName: 'Recycling Center', material: 'HDPE', weight: 45.3, pricePerKg: 1.5, total: 67.95, date: new Date().toISOString() },
    ];

    let transactionItems = []; // For the transaction cart
    let materialChart = null;

    // --- DOM SELECTORS ---
    const pages = {
        login: document.getElementById('login-page'),
        app: document.getElementById('app-container')
    };
    const contentPages = {
        dashboard: document.getElementById('dashboard'),
        transactions: document.getElementById('transactions'),
        reports: document.getElementById('reports')
    };
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Auth elements
    const authForm = document.getElementById('auth-form');
    const nameFieldContainer = document.getElementById('name-field-container');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const authButton = document.getElementById('auth-button');
    const toggleButton = document.getElementById('toggle-button');
    const errorMessage = document.getElementById('error-message');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const logoutButton = document.getElementById('logout-button');
    
    // Dashboard elements
    const totalTransactionsEl = document.getElementById('total-transactions');
    const totalWeightEl = document.getElementById('total-weight');
    const totalPayoutEl = document.getElementById('total-payout');
    const chartCanvas = document.getElementById('material-chart');
    
    // Transactions elements
    const repNameInput = document.getElementById('rep-name');
    const clientNameInput = document.getElementById('client-name');
    const rateSheetSelect = document.getElementById('rate-sheet');
    const materialSelect = document.getElementById('material');
    const weightInput = document.getElementById('weight');
    const addItemForm = document.getElementById('add-item-form');
    const itemListEl = document.getElementById('transaction-item-list');
    const grandTotalEl = document.getElementById('grand-total');
    const saveAllButton = document.getElementById('save-all-button');
    const transactionMessage = document.getElementById('transaction-message');

    // Reports elements
    const reportButtons = document.querySelectorAll('.btn-report');

    // --- RENDER FUNCTIONS ---

    function showPage(pageId) {
        Object.values(pages).forEach(p => p.classList.remove('active'));
        if (pages[pageId]) {
            pages[pageId].classList.add('active');
        }
    }

    function showContentPage(pageId) {
        Object.values(contentPages).forEach(p => p.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        if (contentPages[pageId]) {
            contentPages[pageId].classList.add('active');
            const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
        
        // Refresh data on page view
        if (pageId === 'dashboard') renderDashboard();
        if (pageId === 'transactions') resetTransactionForm();
    }
    
    function renderDashboard() {
        const userTransactions = state.transactionsByUser[state.currentUser.email] || [];
        const totalTransactions = userTransactions.length;
        const totalKg = userTransactions.reduce((sum, tx) => sum + tx.weight, 0);
        const totalValue = userTransactions.reduce((sum, tx) => sum + tx.total, 0);

        totalTransactionsEl.textContent = totalTransactions.toLocaleString();
        totalWeightEl.textContent = totalKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        totalPayoutEl.textContent = `R ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        renderChart(userTransactions);
    }
    
    function renderChart(transactions) {
        const materialTotals = transactions.reduce((acc, tx) => {
            acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
            return acc;
        }, {});

        const chartData = Object.entries(materialTotals)
            .map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
            .sort((a, b) => b.kg - a.kg);
            
        const chartLabels = chartData.map(d => d.name);
        const chartValues = chartData.map(d => d.kg);

        if (materialChart) {
            materialChart.destroy();
        }
        
        materialChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Weight (kg)',
                    data: chartValues,
                    backgroundColor: '#ff6600',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        backgroundColor: '#374151',
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(128, 128, 128, 0.2)'
                        }
                    }
                }
            }
        });
    }
    
    function renderTransactionItems() {
        if (transactionItems.length === 0) {
            itemListEl.innerHTML = `<p class="empty-list-message">No materials added yet.</p>`;
        } else {
            const list = document.createElement('ul');
            transactionItems.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-details">
                        <p>${item.material}</p>
                        <p>${item.weight.toFixed(2)} kg @ R${item.pricePerKg.toFixed(2)}/kg</p>
                    </div>
                    <div class="item-actions">
                        <p>R ${item.total.toFixed(2)}</p>
                        <button data-index="${index}" class="remove-item-btn">&times;</button>
                    </div>
                `;
                list.appendChild(li);
            });
            itemListEl.innerHTML = '';
            itemListEl.appendChild(list);
        }
        
        const grandTotal = transactionItems.reduce((sum, item) => sum + item.total, 0);
        grandTotalEl.textContent = `R ${grandTotal.toFixed(2)}`;
        saveAllButton.textContent = `Complete & Save All (${transactionItems.length})`;
        saveAllButton.disabled = transactionItems.length === 0;
        clientNameInput.disabled = transactionItems.length > 0;
    }


    // --- EVENT HANDLERS & LOGIC ---

    function handleAuthToggle(isRegistering) {
        nameFieldContainer.classList.toggle('hidden', !isRegistering);
        formTitle.textContent = isRegistering ? 'Create an Account' : 'Umvuzo Digital Platform';
        formSubtitle.textContent = isRegistering ? 'Join our platform today' : 'Welcome Back';
        authButton.textContent = isRegistering ? 'Register' : 'Login';
        toggleText.innerHTML = isRegistering
            ? `Already have an account? <button id="toggle-button" class="toggle-button">Login</button>`
            : `Don't have an account? <button id="toggle-button" class="toggle-button">Register</button>`;
        
        // Re-attach listener to the new button
        document.getElementById('toggle-button').addEventListener('click', () => handleAuthToggle(!isRegistering));
        errorMessage.textContent = '';
        nameInput.value = '';
    }

    function handleLogin(email) {
        const name = email.split('@')[0].replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        state.isAuthenticated = true;
        state.currentUser = { email, name };
        
        // If demo user logs in and has no data, populate with demo data
        if (email === 'demo.user@example.com' && !state.transactionsByUser[email]) {
            state.transactionsByUser[email] = DEMO_TRANSACTIONS;
        }

        // Ensure user has an entry
        if (!state.transactionsByUser[email]) {
            state.transactionsByUser[email] = [];
        }

        initializeApp();
    }

    function handleRegister(email, name) {
        if (state.transactionsByUser[email]) {
            errorMessage.textContent = 'An account with this email already exists.';
            return;
        }
        state.isAuthenticated = true;
        state.currentUser = { email, name };
        state.transactionsByUser[email] = []; // Start with a clean slate
        initializeApp();
    }
    
    function handleLogout() {
        state.isAuthenticated = false;
        state.currentUser = null;
        showPage('login');
    }

    function handleAddItem(e) {
        e.preventDefault();
        const weightNum = parseFloat(weightInput.value);
        if (isNaN(weightNum) || weightNum <= 0) {
            displayTransactionMessage('Please enter a valid weight.', true);
            return;
        }
        if (!clientNameInput.value.trim()) {
            displayTransactionMessage('Please enter a client name first.', true);
            return;
        }

        const selectedMaterialType = materialSelect.value;
        const selectedRateSheet = rateSheetSelect.value;
        const materialData = RATE_SHEETS[selectedRateSheet].find(m => m.type === selectedMaterialType);
        
        const newItem = {
            material: selectedMaterialType,
            weight: weightNum,
            pricePerKg: materialData.price,
            total: weightNum * materialData.price,
        };
        transactionItems.push(newItem);
        
        weightInput.value = '';
        materialSelect.selectedIndex = 0;
        renderTransactionItems();
    }
    
    function handleSaveAll() {
        if (transactionItems.length === 0) {
            displayTransactionMessage('Please add at least one material.', true);
            return;
        }
        
        const clientName = clientNameInput.value;
        const repName = state.currentUser.name;
        
        transactionItems.forEach(item => {
            const newTransaction = {
                ...item,
                id: new Date().getTime().toString() + Math.random(),
                date: new Date().toISOString(),
                repName,
                clientName,
            };
            state.transactionsByUser[state.currentUser.email].unshift(newTransaction);
        });
        
        displayTransactionMessage(`${transactionItems.length} transaction(s) saved successfully!`, false);
        resetTransactionForm();
    }
    
    function displayTransactionMessage(text, isError) {
        transactionMessage.textContent = text;
        transactionMessage.className = isError ? 'message error' : 'message success';
        setTimeout(() => transactionMessage.textContent = '', 3000);
    }

    function resetTransactionForm() {
        transactionItems = [];
        clientNameInput.value = '';
        weightInput.value = '';
        renderTransactionItems();
        repNameInput.value = state.currentUser.name;
    }
    
    function handleGenerateReport(type) {
        const userTransactions = state.transactionsByUser[state.currentUser.email] || [];
        let filteredTransactions = [];
        const today = new Date();

        if (type === 'daily') {
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            filteredTransactions = userTransactions.filter(tx => tx.date >= startOfDay && tx.date <= endOfDay);
        } else if (type === 'monthly') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            filteredTransactions = userTransactions.filter(tx => tx.date >= startOfMonth && tx.date <= endOfMonth);
        } else {
            filteredTransactions = userTransactions;
        }

        if (filteredTransactions.length === 0) {
            alert("No data available for the selected report type.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Umvuzo ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 29);

        const tableColumn = ["Date", "Rep", "Client", "Material", "Kg", "Rate", "Total"];
        const tableRows = [];
        let totalPaid = 0;
        let totalKg = 0;

        filteredTransactions.forEach(tx => {
            tableRows.push([
                new Date(tx.date).toLocaleDateString("en-ZA"),
                tx.repName,
                tx.clientName,
                tx.material,
                tx.weight.toFixed(2),
                `R ${tx.pricePerKg.toFixed(2)}`,
                `R ${tx.total.toFixed(2)}`
            ]);
            totalPaid += tx.total;
            totalKg += tx.weight;
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: '#0b6000' },
        });

        const finalY = doc.lastAutoTable.finalY || 200;
        doc.setFontSize(12);
        doc.text(`Total Paid: R ${totalPaid.toFixed(2)}`, 14, finalY + 15);
        doc.text(`Total Kg: ${totalKg.toFixed(2)} kg`, 14, finalY + 22);

        doc.save(`${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // --- INITIALIZATION ---
    function initializeApp() {
        showPage('app');
        showContentPage('dashboard');
        populateRateSheets();
    }

    function populateRateSheets() {
        rateSheetSelect.innerHTML = Object.keys(RATE_SHEETS).map(r => `<option value="${r}">${r}</option>`).join("");
        populateMaterials();
    }

    function populateMaterials() {
        const selectedRateSheet = rateSheetSelect.value;
        materialSelect.innerHTML = RATE_SHEETS[selectedRateSheet].map(m => `<option value="${m.type}">${m.type} (R${m.price}/kg)</option>`).join("");
    }

    // --- EVENT LISTENERS BINDING ---
    toggleButton.addEventListener('click', () => handleAuthToggle(true));
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const isRegistering = !nameFieldContainer.classList.contains('hidden');
        if (isRegistering) {
            handleRegister(emailInput.value, nameInput.value);
        } else {
            handleLogin(emailInput.value);
        }
    });
    logoutButton.addEventListener('click', handleLogout);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showContentPage(e.target.dataset.page);
        });
    });
    
    rateSheetSelect.addEventListener('change', populateMaterials);
    addItemForm.addEventListener('submit', handleAddItem);
    saveAllButton.addEventListener('click', handleSaveAll);
    
    itemListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            transactionItems.splice(index, 1);
            renderTransactionItems();
        }
    });

    reportButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            handleGenerateReport(e.target.dataset.type);
        });
    });

    // Start the app by showing the login page
    showPage('login');
});
