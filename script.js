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

    // IMPOSTAZIONE DATA ODIERNA DI DEFAULT
    const dateInput = document.getElementById('global-date');
    if (dateInput && !dateInput.value) {
        const oggi = new Date().toISOString().split('T')[0];
        dateInput.value = oggi;
    }

    // --- 2. FUNZIONE DI RICERCA CRONOLOGICA PURA PER RIGA ---
    // Cerca a ritroso l'ultimo giorno in cui questa specifica riga ha registrato una rimanenza attiva
    function cercaRimanenzaAttivaPassata(indiceRiga, dataCorrente) {
        let dataTest = new Date(dataCorrente);
        
        // Cerca all'indietro nei precedenti 365 giorni
        for (let i = 0; i < 365; i++) {
            dataTest.setDate(dataTest.getDate() - 1);
            const dataStr = dataTest.toISOString().split('T')[0];
            
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);
            if (datiSalvati) {
                const dati = JSON.parse(datiSalvati);
                if (dati.prestiti && dati.prestiti[indiceRiga]) {
                    const p = dati.prestiti[indiceRiga];
                    
                    // Se la riga conteneva un beneficiario
                    if (p.nome && p.nome.trim() !== "") {
                        const dov = parseFloat(p.dovuto) || 0;
                        const usc = parseFloat(p.uscite) || 0;
                        const ent = parseFloat(p.entrate) || 0;
                        const rim = dov + usc - ent;
                        
                        // APPLICAZIONE LOGICA TIZIANA: Ci interessa lo stato di questa riga.
                        // Se la rimanenza era maggiore di zero, restituiamo il blocco storico (Nome e Cifra).
                        // Se era 0, significa che il debito su questa riga si è estinto nel passato, quindi restituiamo null per fermarci.
                        if (rim > 0) {
                            return { nome: p.nome, rimanenza: rim };
                        } else {
                            return null;
                        }
                    }
                }
            }
        }
        return null;
    }

    // --- 3. LOGICA DEI CALCOLI AUTOMATICI E DEL TRASCINAMENTO ---
    function ricalcolaTutto() {
        const dataSelezionata = dateInput.value;

        // A) Conteggio Totale Pagina Entrate
        let totaleEntrate = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrate += parseFloat(input.value) || 0;
            if (input.value === "") {
                const rigaPadre = input.closest('.input-row');
                if (rigaPadre) {
                    const selectMese = rigaPadre.querySelector('.period-select');
                    if (selectMese) selectMese.value = "";
                }
            }
        });
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) entrateTotaleEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;

        // B) Conteggio Storico ed Estratto Conto Pagina Prestiti
        let totaleRimanenzePrestiti = 0;
        document.querySelectorAll('#loans-table-body .loan-row').forEach((riga, index) => {
            const campoNome = riga.querySelector('.loan-name');
            const campoDovuto = riga.querySelector('.loan-dovuto');
            const campoUscite = riga.querySelector('.loan-uscite');
            const campoEntrate = riga.querySelector('.loan-entrate');
            const campoRimanenza = riga.querySelector('.loan-rimanenza');

            // 1. Controlliamo se per questo giorno specifico esistono già dati salvati nel LocalStorage
            const dataSelezionata = dateInput.value;
            const datiSalvatiDelGiorno = localStorage.getItem(`dati_${dataSelezionata}`);
            const haDatiSalvatiOggi = datiSalvatiDelGiorno !== null;

            // 2. Cerchiamo la storia passata di questa riga
            const storiaPassata = cercaRimanenzaAttivaPassata(index, dataSelezionata);
            
            // 3. Se la giornata in esame NON ha dati salvati nel database (è un giorno nuovo/vuoto),
            // ed esiste un debito residuo nel passato su questa riga, popoliamo in automatico il NOME.
            if (!haDatiSalvatiOggi && campoNome.value.trim() === "" && storiaPassata) {
                campoNome.value = storiaPassata.nome;
            }

            const nomeAttuale = campoNome ? campoNome.value : "";
            let saldoEreditato = 0;

            // Il saldo viene ereditato passivamente se c'è una storia attiva
            if (storiaPassata && nomeAttuale.trim() !== "") {
                saldoEreditato = storiaPassata.rimanenza;
            }

            // Gestione dei Placeholder grafici per il Totale Dovuto
            if (saldoEreditato > 0 && campoDovuto.value === "") {
                campoDovuto.placeholder = saldoEreditato.toFixed(2);
            } else {
                campoDovuto.placeholder = "0.00";
            }

            // Calcolo matematico definitivo della riga
            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const uscite = parseFloat(campoUscite.value) || 0;
            const entrate = parseFloat(campoEntrate.value) || 0;

            const rimanenza = dovuto + uscite - entrate;

            if (nomeAttuale.trim() === "" && dovuto === 0 && uscite === 0 && entrate === 0) {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                totaleRimanenzePrestiti += rimanenza > 0 ? rimanenza : 0;
            }
        });

        const loansTotaleEl = document.getElementById('page-loans-total');
        if (loansTotaleEl) loansTotaleEl.textContent = `€ ${totaleRimanenzePrestiti.toFixed(2)}`;

        // C) Totale Giornata Unificato
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            dailyTotalEl.textContent = `€ ${(totaleEntrate + totaleRimanenzePrestiti).toFixed(2)}`;
        }
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input') || e.target.classList.contains('loan-amount-input') || e.target.classList.contains('loan-name')) {
            ricalcolaTutto();
        }
    });

    // --- 4. MOTORE SALVATAGGIO E CARICAMENTO ---
    function salvaDatiCorrenti() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        const datiDaSalvare = { stipendi: {}, varie: [], prestiti: [] };

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

        document.querySelectorAll('#page-entrate .row-varie').forEach(riga => {
            datiDaSalvare.varie.push({
                categoria: riga.querySelector('select')?.value || "",
                nota: riga.querySelector('.note-input')?.value || "",
                cifra: riga.querySelector('.amount-input')?.value || ""
            });
        });

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

        // Reset visivo totale preventivo all'atto del cambio data
        document.querySelectorAll('main select').forEach(s => s.value = "");
        document.querySelectorAll('main input[type="text"]').forEach(i => i.value = "");
        document.querySelectorAll('main input[type="number"]').forEach(n => n.value = "");

        const datiSalvati = localStorage.getItem(`dati_${dataSelezionata}`);

        if (datiSalvati) {
            const dati = JSON.parse(datiSalvati);

            righeFisse.forEach(id => {
                const riga = document.getElementById(id);
                if (riga && dati.stipendi && dati.stipendi[id]) {
                    if (riga.querySelector('select')) riga.querySelector('select').value = dati.stipendi[id].mese;
                    if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.stipendi[id].nota;
                    if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.stipendi[id].cifra;
                }
            });

            const righeVarie = document.querySelectorAll('#page-entrate .row-varie');
            righeVarie.forEach((riga, index) => {
                if (dati.varie && dati.varie[index]) {
                    if (riga.querySelector('select')) riga.querySelector('select').value = dati.varie[index].categoria;
                    if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.varie[index].nota;
                    if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.varie[index].cifra;
                }
            });

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

        // Il ricalcolo fa il lavoro pesante basandosi sullo stato del database
        ricalcolaTutto();
    }

    if (dateInput) {
        dateInput.addEventListener('change', caricaDatiData);
    }

    // BOTTONI SUPERIORI
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

    // SIDEBAR NAVIGAZIONE
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    
    function cambiaPagina(idPagina, pulsanteSelezionato) {
        document.querySelectorAll('.page-body').forEach(p => p.style.display = 'none');
        const paginaTarget = document.getElementById(idPagina);
        if (paginaTarget) paginaTarget.style.display = 'block';
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        if (pulsanteSelezionato) pulsanteSelezionato.classList.add('active');
    }

    if (menuEntrate) menuEntrate.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-entrate', menuEntrate); });
    if (menuPrestiti) menuPrestiti.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-prestiti', menuPrestiti); });

    caricaDatiData();
});
