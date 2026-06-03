document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTI DI NAVIGAZIONE (MENU LATERALE)
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    
    // PAGINE (CONTENITORI)
    const pageEntrate = document.getElementById('page-entrate');
    const pagePrestiti = document.getElementById('page-prestiti');

    // CONTROLLI GLOBALI
    const dateInput = document.getElementById('global-date');
    const dailyTotalEl = document.getElementById('daily-total');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');

    // Imposta la data di oggi in automatico all'avvio
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // --- 1. GESTIONE DEL CAMBIO PAGINA (NAVIGAZIONE) ---
    function switchPage(pageToDisplay, menuActive) {
        // Nascondi tutte le pagine
        pageEntrate.style.display = 'none';
        pagePrestiti.style.display = 'none';
        
        // Mostra solo la pagina selezionata
        pageToDisplay.style.display = 'block';
        
        // Gestisci la classe 'active' visiva sui pulsanti del menu
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        menuActive.classList.add('active');
    }

    // Clicchi su Entrate
    menuEntrate.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(pageEntrate, menuEntrate);
    });

    // Clicchi su Prestiti
    menuPrestiti.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(pagePrestiti, menuPrestiti);
    });

    // Avviso temporaneo per le altre pagine ancora non create
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.id !== 'menu-entrate' && item.id !== 'menu-prestiti') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                alert(`La pagina "${item.textContent.trim().substring(2)}" è in costruzione!`);
            });
        }
    });

    // --- 2. LOGICA DI CALCOLO TOTALI (PROVVISORIA PER GRAFICA) ---
    function calculateGlobalTotal() {
        let globalTotal = 0;
        // Prende tutti gli input numerici sparsi nell'intera app
        const allAmountInputs = document.querySelectorAll('.amount-input, .loan-amount-input');
        
        allAmountInputs.forEach(input => {
            // Saltiamo la colonna RIMANENZA che è in sola lettura per non raddoppiare i calcoli
            if (!input.readOnly) {
                const value = parseFloat(input.value);
                if (!isNaN(value)) {
                    globalTotal += value;
                }
            }
        });
        
        dailyTotalEl.textContent = `€ ${globalTotal.toFixed(2)}`;
    }

    // Ascolta gli inserimenti numerici in entrambi i moduli
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input') || e.target.classList.contains('loan-amount-input')) {
            calculateGlobalTotal();
        }
    });

    // Tasto Stampa
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Tasto Salva (Messaggio di base per ora)
    saveBtn.addEventListener('click', () => {
        alert('Salvataggio configurato per la struttura grafica attuale!');
    });

    // Di default, all'avvio, mostriamo la prima pagina (Entrate Generali)
    switchPage(pageEntrate, menuEntrate);
});
