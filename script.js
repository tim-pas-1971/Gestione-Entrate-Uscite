document.addEventListener('DOMContentLoaded', () => {
    
    // 1. COMPILAZIONE RIGHE FISSE IN ALTO (NASPI / PENSIONE / STIPENDIO)
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA", "TREDICESIMA", "QUATTORDICESIMA"];

    function inizializzaRigaFissa(id) {
        const riga = document.getElementById(id);
        if (!riga) return;

        // Tendina Mesi
        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.forEach(m => {
            select.innerHTML += `<option value="${m}">${m}</option>`;
        });

        // Input Testo Libero
        const inputNote = document.createElement('input');
        inputNote.type = 'text';
        inputNote.placeholder = 'Note...';
        inputNote.className = 'note-input';

        // Campo Importo Numerico
        const wrapper = document.createElement('div');
        wrapper.className = 'amount-wrapper';
        wrapper.innerHTML = '<input type="number" step="0.01" class="amount-input" placeholder="0.00">';

        // Aggancio pulito sulla stessa linea
        riga.appendChild(select);
        riga.appendChild(inputNote);
        riga.appendChild(wrapper);
    }

    const righeFisse = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                         'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righeFisse.forEach(inizializzaRigaFissa);


    // 2. LOGICA DEI CALCOLI AUTOMATICI
    function ricalcolaTutto() {
        let totaleEntrate = 0;
        
        // Seleziona e somma tutti i campi con classe .amount-input presenti nella pagina
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrate += parseFloat(input.value) || 0;
        });
        
        // Aggiorna il totale parziale della pagina corrente
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) {
            entrateTotaleEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;
        }

        // Aggiorna il totale generale di giornata in alto a destra
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            dailyTotalEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;
        }
    }

    // Esegue il calcolo ogni volta che l'utente inserisce o modifica una cifra
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            ricalcolaTutto();
        }
    });


    // 3. GESTIONE DELLA NAVIGAZIONE (CAMBIO PAGINE)
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    
    function cambiaPagina(idPagina, pulsanteSelezionato) {
        document.querySelectorAll('.page-body').forEach(p => p.style.display = 'none');
        
        const paginaTarget = document.getElementById(idPagina);
        if (paginaTarget) paginaTarget.style.display = 'block';
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        if (pulsanteSelezionato) pulsanteSelezionato.classList.add('active');
    }

    if (menuEntrate) {
        menuEntrate.addEventListener('click', (e) => {
            e.preventDefault();
            cambiaPagina('page-entrate', menuEntrate);
        });
    }
    if (menuPrestiti) {
        menuPrestiti.addEventListener('click', (e) => {
            e.preventDefault();
            cambiaPagina('page-prestiti', menuPrestiti);
        });
    }
});
