document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GENERAZIONE MESI PER LE RIGHE FISSE DI STIPENDIO
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA", "TREDICESIMA", "QUATTORDICESIMA"];

    function inizializzaRigaStipendio(id) {
        const riga = document.getElementById(id);
        if (!riga) return;

        // Crea la tendina del mese
        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.forEach(m => {
            select.innerHTML += `<option value="${m}">${m}</option>`;
        });

        // Crea il campo note (mancava ed era disallineato prima!)
        const inputNote = document.createElement('input');
        inputNote.type = 'text';
        inputNote.placeholder = 'Note...';
        inputNote.className = 'note-input';

        // Crea il riquadro dell'importo
        const wrapper = document.createElement('div');
        wrapper.className = 'amount-wrapper';
        wrapper.innerHTML = '<input type="number" step="0.01" class="amount-input" placeholder="0.00">';

        // Appende tutto in fila nell'ordine corretto
        riga.appendChild(select);
        riga.appendChild(inputNote);
        riga.appendChild(wrapper);
    }

    // Esegue l'inizializzazione sulle prime 6 righe
    const righeStipendi = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                           'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righeStipendi.forEach(inizializzaRigaStipendio);


    // 2. MOTORE DEI CALCOLI IN TEMPO REALE
    function calcolaTotali() {
        let sommaEntrate = 0;
        
        // Cerca tutti i campi cifra nella pagina entrate e li somma
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            sommaEntrate += parseFloat(input.value) || 0;
        });
        
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) {
            entrateTotaleEl.textContent = `€ ${sommaEntrate.toFixed(2)}`;
        }

        // Il totale di giornata (al momento riflette le sole entrate correnti)
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            dailyTotalEl.textContent = `€ ${sommaEntrate.toFixed(2)}`;
        }
    }

    // Ascolta quando scrivi in qualunque campo numero
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            calcolaTotali();
        }
    });


    // 3. CAMBIO PAGINE (NAVIGAZIONE)
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    
    function mostraPagina(pageId, bottoneAttivo) {
        document.querySelectorAll('.page-body').forEach(p => p.style.display = 'none');
        
        const paginaTarget = document.getElementById(pageId);
        if (paginaTarget) paginaTarget.style.display = 'block';
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        if (bottoneAttivo) bottoneAttivo.classList.add('active');
    }

    if (menuEntrate) {
        menuEntrate.addEventListener('click', (e) => {
            e.preventDefault();
            mostraPagina('page-entrate', menuEntrate);
        });
    }
    if (menuPrestiti) {
        menuPrestiti.addEventListener('click', (e) => {
            e.preventDefault();
            mostraPagina('page-prestiti', menuPrestiti);
        });
    }
});
