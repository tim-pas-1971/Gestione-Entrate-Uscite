document.addEventListener('DOMContentLoaded', () => {
    // 1. GENERAZIONE TENDINE AUTOMATICA
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA", "TREDICESIMA", "QUATTORDICESIMA"];

    function aggiungiElementi(id) {
        const riga = document.getElementById(id);
        if (!riga) return;
        
        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.forEach(m => { select.innerHTML += `<option value="${m}">${m}</option>`; });
        
        const div = document.createElement('div');
        div.className = 'amount-wrapper';
        div.innerHTML = '<input type="number" step="0.01" class="amount-input" placeholder="0.00">';
        
        riga.appendChild(select);
        riga.appendChild(div);
    }

    const righe = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                   'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righe.forEach(aggiungiElementi);

    // 2. FUNZIONE CENTRALE PER I CALCOLI (Aggiornata per entrambe le pagine)
    function updateAllTotals() {
        // Calcolo Entrate
        let entrateTotal = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            entrateTotal += parseFloat(input.value) || 0;
        });
        const entrateEl = document.getElementById('page-entrate-total');
        if (entrateEl) entrateEl.textContent = `€ ${entrateTotal.toFixed(2)}`;

        // Calcolo Prestiti
        let prestitiTotal = 0;
        document.querySelectorAll('#page-prestiti .loan-amount-input').forEach(input => {
            prestitiTotal += parseFloat(input.value) || 0;
        });
        const loansEl = document.getElementById('page-loans-total');
        if (loansEl) loansEl.textContent = `€ ${prestitiTotal.toFixed(2)}`;

        // Totale Globale
        const dailyTotal = entrateTotal + prestitiTotal;
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) dailyTotalEl.textContent = `€ ${dailyTotal.toFixed(2)}`;
    }

    // Ascolta ogni input (sia entrate che prestiti)
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input') || e.target.classList.contains('loan-amount-input')) {
            updateAllTotals();
        }
    });

    // 3. NAVIGAZIONE PAGINE
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    const pageEntrate = document.getElementById('page-entrate');
    const pagePrestiti = document.getElementById('page-prestiti');

    function switchPage(pageToDisplay, menuActive) {
        document.querySelectorAll('.page-body').forEach(p => p.style.display = 'none');
        pageToDisplay.style.display = 'block';
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        menuActive.classList.add('active');
    }

    if(menuEntrate) menuEntrate.addEventListener('click', (e) => { e.preventDefault(); switchPage(pageEntrate, menuEntrate); });
    if(menuPrestiti) menuPrestiti.addEventListener('click', (e) => { e.preventDefault(); switchPage(pagePrestiti, menuPrestiti); });

    // Avviso per le altre pagine
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.id !== 'menu-entrate' && item.id !== 'menu-prestiti') {
            item.addEventListener('click', (e) => { e.preventDefault(); alert('Pagina in costruzione!'); });
        }
    });
});
