document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. COMPILAZIONE RIGHE FISSE (NASPI / PENSIONE / STIPENDIO) ---
    const mesi = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", 
                  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE", 
                  "BONUS / UNA TANTUM", "TFR", "BUONUSCITA", "TREDICESIMA", "QUATTORDICESIMA"];

    function inizializzaRigaFissa(id) {
        const riga = document.getElementById(id);
        if (!riga) return;

        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.forEach(m => { select.innerHTML += `<option value="${m}">${m}</option>`; });

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


    // --- 3. LOGICA DEI CALCOLI AUTOMATICI ---
    function ricalcolaTutto() {
        let totaleEntrate = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrate += parseFloat(input.value) || 0;
        });
        
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) entrateTotaleEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;

        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) dailyTotalEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            ricalcolaTutto();
        }
    });


    // --- 4. MOTORE DI SALVATAGGIO E CARICAMENTO DATI ---
    
    function salvaDatiCorrenti() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        const datiDaSalvare = {
            stipendi: {},
            varie: []
        };

        // Salva le 6 righe fisse superiori
        righeFisse.forEach(id => {
            const riga = document.getElementById(id);
            if (riga) {
                const sel = riga.querySelector('select');
                const not = riga.querySelector('.note-input');
                const am = riga.querySelector('.amount-input');
                datiDaSalvare.stipendi[id] = {
                    mese: sel ? sel.value : "",
                    nota: not ? not.value : "",
                    cifra: am ? am.value : ""
                };
            }
        });

        // Salva le 10 righe delle Entrate Varie
        const contenitoreVarie = document.getElementById('varie-inputs-container');
        if (contenitoreVarie) {
            contenitoreVarie.querySelectorAll('.input-row').forEach(riga => {
                const sel = riga.querySelector('select');
                const not = riga.querySelector('.note-input');
                const am = riga.querySelector('.amount-input');
                datiDaSalvare.varie.push({
                    categoria: sel ? sel.value : "",
                    nota: not ? not.value : "",
                    cifra: am ? am.value : ""
                });
            });
        }

        localStorage.setItem(`dati_${dataSelezionata}`, JSON.stringify(datiDaSalvare));
    }

    function caricaDatiData() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        const datiSalvati = localStorage.getItem(`dati_${dataSelezionata}`);

        if (datiSalvati) {
            const dati = JSON.parse(datiSalvati);

            // Ripristina le righe fisse
            righeFisse.forEach(id => {
                const riga = document.getElementById(id);
                if (riga && dati.stipendi && dati.stipendi[id]) {
                    const sel = riga.querySelector('select');
                    const not = riga.querySelector('.note-input');
                    const am = riga.querySelector('.amount-input');
                    if (sel) sel.value = dati.stipendi[id].mese;
                    if (not) not.value = dati.stipendi[id].nota;
                    if (am) am.value = dati.stipendi[id].cifra;
                }
            });

            // Ripristina le entrate varie
            const contenitoreVarie = document.getElementById('varie-inputs-container');
            if (contenitoreVarie) {
                const righeVarie = contenitoreVarie.querySelectorAll('.input-row');
                righeVarie.forEach((riga, index) => {
                    if (dati.varie && dati.varie[index]) {
                        const sel = riga.querySelector('select');
                        const not = riga.querySelector('.note-input');
                        const am = riga.querySelector('.amount-input');
                        if (sel) sel.value = dati.varie[index].categoria;
                        if (not) not.value = dati.varie[index].nota;
                        if (am) am.value = dati.varie[index].cifra;
                    }
                });
            }
        } else {
            // Se non ci sono dati salvati per questo giorno, svuota e pulisci la videata
            document.querySelectorAll('#page-entrate select').forEach(s => s.value = "");
            document.querySelectorAll('#page-entrate input[type="text"]').forEach(i => i.value = "");
            document.querySelectorAll('#page-entrate input[type="number"]').forEach(n => n.value = "");
        }

        ricalcolaTutto();
    }

    // Cambiando la data dal calendario, carichiamo semplicemente i dati memorizzati per quel giorno
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
        printBtn.addEventListener('click', () => {
            window.print();
        });
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

    // Esegui il caricamento iniziale per la giornata odierna
    caricaDatiData();
});
