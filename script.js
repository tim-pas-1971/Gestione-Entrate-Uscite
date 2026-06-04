document.addEventListener('DOMContentLoaded', () => {
    // 1. GENERAZIONE TENDINE AUTOMATICA
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA"];

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

    // 2. FUNZIONE CENTRALE PER I CALCOLI (Questa è quella che cercavi!)
    function calculateTotals() {
        let entratePageTotal = 0;
        
        // Calcola totale Entrate (cerca tutti gli input con classe amount-input)
        const allInputs = document.querySelectorAll('.amount-input');
        allInputs.forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                entratePageTotal += value;
            }
        });

        // Aggiorna totale di pagina (se esiste l'elemento)
        const pageTotalEl = document.getElementById('page-entrate-total');
        if (pageTotalEl) {
            pageTotalEl.textContent = `€ ${entratePageTotal.toFixed(2)}`;
        }

        // Aggiorna totale globale (in alto)
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            dailyTotalEl.textContent = `€ ${entratePageTotal.toFixed(2)}`;
        }
    }

    // Ascolta ogni variazione negli input per aggiornare i totali
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            calculateTotals();
        }
    });

    // 3. NAVIGAZIONE PAGINE (Logica già esistente)
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    const pageEntrate = document.getElementById('page-entrate');
    const pagePrestiti = document.getElementById('page-prestiti');

    function switchPage(pageToDisplay, menuActive) {
        pageEntrate.style.display = 'none';
        pagePrestiti.style.display = 'none';
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
