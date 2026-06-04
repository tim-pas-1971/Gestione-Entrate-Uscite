document.addEventListener('DOMContentLoaded', () => {
    // 1. GENERAZIONE TENDINE AUTOMATICA
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA"];

    function aggiungiElementi(id) {
        const riga = document.getElementById(id);
        if (!riga) return;
        
        // Crea tendina
        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.forEach(m => { select.innerHTML += `<option value="${m}">${m}</option>`; });
        
        // Crea input importo
        const div = document.createElement('div');
        div.className = 'amount-wrapper';
        div.innerHTML = '<input type="number" step="0.01" class="amount-input" placeholder="0.00">';
        
        riga.appendChild(select);
        riga.appendChild(div);
    }

    const righe = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                   'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righe.forEach(aggiungiElementi);

    // 2. FORMATO IMPORTO (Massimo 8 cifre totali)
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            let val = e.target.value;
            if (val.length > 8) e.target.value = val.slice(0, 8);
        }
    });
    
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
