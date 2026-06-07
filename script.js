document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. COMPILAZIONE RIGHE FISSE ENTRATE (Con - Periodo - in cima) ---
    const mesi = ["- Periodo -", "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA", "TREDICESIMA", "QUATTORDICESIMA"];

    function inizializzaRigaFissa(id) {
        const riga = document.getElementById(id);
        if (!riga) return;

        const select = document.createElement('select');
        select.className = 'period-select';
        
        mesi.forEach((m, index) => {
            if (index === 0) {
                select.innerHTML += `<option value="">${m}</option>`;
            } else {
                select.innerHTML += `<option value="${m}">${m}</option>`;
            }
        });

        const inputNote = document.createElement('input');
        inputNote.type = 'text';
        inputNote.placeholder = 'Note...';
        inputNote.className = 'note-input';

        const wrapper = document.createElement('div');
        wrapper.className = 'amount-wrapper';
        wrapper.innerHTML = '<input type="number" step="0.01" class="amount-input" placeholder="0.00">';

        riga.appendChild(select);
        riga.appendChild(inputNote);
        riga.appendChild(wrapper);
    }

    const righeFisse = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                        'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righeFisse.forEach(inizializzaRigaFissa);


    // --- 2. IMPOSTAZIONE DATA ODIERNA DI DEFAULT ---
    const dateInput = document.getElementById('global-date');
    if (dateInput && !dateInput.value) {
        const oggi = new Date().toISOString().split('T')[0];
        dateInput.value = oggi;
    }


    // --- 3. LOGICA DEI CALCOLI AUTOMATICI (ENTRATE E PRESTITI) ---
    function ricalcolaTutto() {
        // A) Conteggio Totale Pagina Entrate
        let totaleEntrate = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrate += parseFloat(input.value) || 0;
        });
        
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) entrateTotaleEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;

        // B) Conteggio Tabella Prestiti (Riga per riga + Totale di Pagina)
        let totaleRimanenzePrestiti = 0;
        document.querySelectorAll('#loans-table-body .loan-row').forEach(riga => {
            const dovuto = parseFloat(riga.querySelector('.loan-dovuto').value) || 0;
            const uscite = parseFloat(riga.querySelector('.loan-uscite').value) || 0;
            const entrate = parseFloat(riga.querySelector('.loan-entrate').value) || 0;
            
            const rimanenza = dovuto + uscite - entrate;
            
            const campoRimanenza = riga.querySelector('.loan-rimanenza');
            if (campoRimanenza) {
                campoRimanenza.value = rimanenza.toFixed(2);
            }
            
            totaleRimanenzePrestiti += rimanenza;
        });

        const loansTotaleEl = document.getElementById('page-loans-total');
        if (loansTotaleEl) loansTotaleEl.textContent = `€ ${totaleRimanenzePrestiti.toFixed(2)}`;

        // C) Totale Giornata Unificato in Alto a Destra (Entrate + Rimanenze)
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            const totaleGiornata = totaleEntrate + totaleRimanenzePrestiti;
            dailyTotalEl.textContent = `€ ${totaleGiornata.toFixed(2)}`;
        }
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input') || e.target.classList.contains('loan-amount-input')) {
            ricalcolaTutto();
        }
    });


    // --- 4. MOTORE CENTRALIZZATO SALVATAGGIO E CARICAMENTO DATI ---
    
    function salvaDatiCorrenti() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        const datiDaSalvare = {
            stipendi: {},
            varie: [],
            prestiti: []
        };

        // Salva pagina Entrate - Sezione Fissa
        righeFisse.forEach(id => {
            const riga = document.getElementById(id);
            if (riga) {
                datiDaSalvare.stipendi[id] = {
                    mese: riga.querySelector('select')?.value || "",
                    nota: riga.querySelector('.note-input')?.value || "",
                    cifra: riga.querySelector('.amount-input')?.value || ""
                };
            }
        });

        // Salva pagina Entrate - Sezione Varie
        document.querySelectorAll('#page-entrate .row-varie').forEach(riga => {
            datiDaSalvare.varie.push({
                categoria: riga.querySelector('select')?.value || "",
                nota: riga.querySelector('.note-input')?.value || "",
                cifra: riga.querySelector('.amount-input')?.value || ""
            });
        });

        // Salva pagina Prestiti - Tabella
        document.querySelectorAll('#loans-table-body .loan-row').forEach(riga => {
            datiDaSalvare.prestiti.push({
                nome: riga.querySelector('.loan-name').value,
                nota: riga.querySelector('.loan-note').value,
                dovuto: riga.querySelector('.loan-dovuto').value,
                uscite: riga.querySelector('.loan-uscite').value,
                entrate: riga.querySelector('.loan-entrate').value
            });
        });

        localStorage.setItem(`dati_${dataSelezionata}`, JSON.stringify(datiDaSalvare));
    }

    function caricaDatiData() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        // Reset preventivo assoluto di TUTTI i campi esistenti nella pagina
        // Questo garantisce che nessun dato vecchio rimanga "appiccicato" cambiando data
        document.querySelectorAll('main select').forEach(s => s.value = "");
        document.querySelectorAll('main input[type="text"]').forEach(i => i.value = "");
        document.querySelectorAll('main input[type="number"]').forEach(n => n.value = "");

        const datiSalvati = localStorage.getItem(`dati_${dataSelezionata}`);

        if (datiSalvati) {
            const dati = JSON.parse(datiSalvati);

            // Carica Righe Fisse Entrate
            righeFisse.forEach(id => {
                const riga = document.getElementById(id);
                if (riga && dati.stipendi && dati.stipendi[id]) {
                    if (riga.querySelector('select')) riga.querySelector('select').value = dati.stipendi[id].mese;
                    if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.stipendi[id].nota;
                    if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.stipendi[id].cifra;
                }
            });

            // Carica Righe Varie Entrate
            const righeVarie = document.querySelectorAll('#page-entrate .row-varie');
            righeVarie.forEach((riga, index) => {
                if (dati.varie && dati.varie[index]) {
                    if (riga.querySelector('select')) riga.querySelector('select').value = dati.varie[index].categoria;
                    if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.varie[index].nota;
                    if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.varie[index].cifra;
                }
            });

            // Carica Righe Tabella Prestiti
            const righeTabellaPrestiti = document.querySelectorAll('#loans-table-body .loan-row');
            righeTabellaPrestiti.forEach((riga, index) => {
                if (dati.prestiti && dati.prestiti[index]) {
                    riga.querySelector('.loan-name').value = dati.prestiti[index].nome || "";
                    riga.querySelector('.loan-note').value = dati.prestiti[index].nota || "";
                    riga.querySelector('.loan-dovuto').value = dati.prestiti[index].dovuto || "";
                    riga.querySelector('.loan-uscite').value = dati.prestiti[index].uscite || "";
                    riga.querySelector('.loan-entrate').value = dati.prestiti[index].entrate || "";
                }
            });
        }

        // Ricalcola immediatamente i totali (se il giorno è vuoto, i totali andranno a 0.00)
        ricalcolaTutto();
    }

    if (dateInput) {
        dateInput.addEventListener('change', caricaDatiData);
    }


    // --- 5. GESTIONE PULSANTI BARRA SUPERIORE (SALVA / STAMPA) ---
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            salvaDatiCorrenti();
            alert(`Dati del giorno ${dateInput.value} salvati con successo!`);
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => { window.print(); });
    }


    // --- 6. GESTIONE DELLA NAVIGAZIONE PAGINE (SIDEBAR) ---
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
        menuEntrate.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-entrate', menuEntrate); });
    }
    if (menuPrestiti) {
        menuPrestiti.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-prestiti', menuPrestiti); });
    }

    // Caricamento dei dati all'avvio dell'app
    caricaDatiData();
});
