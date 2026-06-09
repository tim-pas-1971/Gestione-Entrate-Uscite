document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. COMPILAZIONE RIGHE FISSE ENTRATE ---
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
        const oggi = new Date();
        const anno = oggi.getFullYear();
        const mese = String(oggi.getMonth() + 1).padStart(2, '0');
        const giorno = String(oggi.getDate()).padStart(2, '0');
        dateInput.value = `${anno}-${mese}-${giorno}`;
    }

    // --- 2. FUNZIONE DI SOTTRAZIONE DATA SICURA ---
    function sottraiGiorni(dataStr, giorniDaSottrarre) {
        const parti = dataStr.split('-');
        const anno = parseInt(parti[0], 10);
        const mese = parseInt(parti[1], 10) - 1;
        const giorno = parseInt(parti[2], 10);
        
        const d = new Date(anno, mese, giorno);
        d.setDate(d.getDate() - giorniDaSottrarre);
        
        const rAnno = d.getFullYear();
        const rMese = String(d.getMonth() + 1).padStart(2, '0');
        const rGiorno = String(d.getDate()).padStart(2, '0');
        
        return `${rAnno}-${rMese}-${rGiorno}`;
    }

    // --- 3. MOTORI DI RICERCA CRONOLOGICA (PRESTITI E FINANZIAMENTI) ---
    function calcolaRimanenzaStoricaPrestiti(indiceRiga, dataTarget) {
        let nomeTrovato = "";
        let debitoResiduo = 0;
        let haTrovatoStoria = false;

        for (let i = 1; i <= 365; i++) {
            const dataStr = sottraiGiorni(dataTarget, i);
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);

            if (datiSalvati) {
                const dati = JSON.parse(datiSalvati);
                if (dati.prestiti && dati.prestiti[indiceRiga]) {
                    const p = dati.prestiti[indiceRiga];
                    if ((p.nome && p.nome.trim() !== "") || p.dovuto || p.uscite || p.entrate) {
                        if (!nomeTrovato && p.nome && p.nome.trim() !== "") nomeTrovato = p.nome;
                        const saldoPrec = calcolaRimanenzaStoricaPrestiti(indiceRiga, dataStr);
                        const dovuto = p.dovuto !== "" ? (parseFloat(p.dovuto) || 0) : (saldoPrec ? saldoPrec.rimanenza : 0);
                        debitoResiduo = dovuto + (parseFloat(p.uscite) || 0) - (parseFloat(p.entrate) || 0);
                        if (!nomeTrovato && saldoPrec) nomeTrovato = saldoPrec.nome;
                        haTrovatoStoria = true;
                        break;
                    }
                }
            }
        }
        return haTrovatoStoria ? { nome: nomeTrovato, rimanenza: debitoResiduo } : null;
    }

    function calcolaRimanenzaStoricaFinanziamenti(indiceRiga, dataTarget) {
        let nomeTrovato = "";
        let finanziariaTrovata = "";
        let debitoResiduo = 0;
        let haTrovatoStoria = false;

        for (let i = 1; i <= 365; i++) {
            const dataStr = sottraiGiorni(dataTarget, i);
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);

            if (datiSalvati) {
                const dati = JSON.parse(datiSalvati);
                if (dati.finanziamenti && dati.finanziamenti[indiceRiga]) {
                    const f = dati.finanziamenti[indiceRiga];
                    if ((f.nome && f.nome.trim() !== "") || f.finanziaria || f.dovuto || f.uscite || f.entrate) {
                        if (!nomeTrovato && f.nome && f.nome.trim() !== "") nomeTrovato = f.nome;
                        if (!finanziariaTrovata && f.finanziaria) finanziariaTrovata = f.finanziaria;
                        
                        const saldoPrec = calcolaRimanenzaStoricaFinanziamenti(indiceRiga, dataStr);
                        const dovuto = f.dovuto !== "" ? (parseFloat(f.dovuto) || 0) : (saldoPrec ? saldoPrec.rimanenza : 0);
                        debitoResiduo = dovuto + (parseFloat(f.uscite) || 0) - (parseFloat(f.entrate) || 0);
                        
                        if (!nomeTrovato && saldoPrec) nomeTrovato = saldoPrec.nome;
                        if (!finanziariaTrovata && saldoPrec) finanziariaTrovata = saldoPrec.finanziaria;
                        haTrovatoStoria = true;
                        break;
                    }
                }
            }
        }
        return haTrovatoStoria ? { nome: nomeTrovato, finanziaria: finanziariaTrovata, rimanenza: debitoResiduo } : null;
    }

    // --- 4. LOGICA DEI CALCOLI AUTOMATICI E DEL TRASCINAMENTO ---
    function ricalcolaTutto() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        // A) Conteggio Totale Pagina Entrate
        let totaleEntrate = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrate += parseFloat(input.value) || 0;
        });
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) entrateTotaleEl.textContent = `€ ${totaleEntrate.toFixed(2)}`;

        const datiSalvatiDelGiorno = localStorage.getItem(`dati_${dataSelezionata}`);
        const haDatiSalvatiOggi = datiSalvatiDelGiorno !== null;

        // B) Tabella 1: PRESTITI
        let totaleRimanenzePrestiti = 0;
        document.querySelectorAll('#loans-table-body .loan-row').forEach((riga, index) => {
            const campoNome = riga.querySelector('.loan-name');
            const campoDovuto = riga.querySelector('.loan-dovuto');
            const campoUscite = riga.querySelector('.loan-uscite');
            const campoEntrate = riga.querySelector('.loan-entrate');
            const campoRimanenza = riga.querySelector('.loan-rimanenza');

            const storiaPassata = calcolaRimanenzaStoricaPrestiti(index, dataSelezionata);
            
            if (!haDatiSalvatiOggi && campoNome.value.trim() === "" && storiaPassata && storiaPassata.rimanenza !== 0) {
                campoNome.value = storiaPassata.nome;
            }

            const nomeAttuale = campoNome ? campoNome.value : "";
            let saldoEreditato = (storiaPassata && storiaPassata.rimanenza !== 0) ? storiaPassata.rimanenza : 0;

            campoDovuto.placeholder = saldoEreditato !== 0 ? saldoEreditato.toFixed(2) : "0.00";

            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const rimanenza = dovuto + (parseFloat(campoUscite.value) || 0) - (parseFloat(campoEntrate.value) || 0);

            if (nomeAttuale.trim() === "" && dovuto === 0 && campoUscite.value === "" && campoEntrate.value === "") {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                totaleRimanenzePrestiti += rimanenza > 0 ? rimanenza : 0;
            }
        });
        const loansTotaleEl = document.getElementById('page-loans-total');
        if (loansTotaleEl) loansTotaleEl.textContent = `€ ${totaleRimanenzePrestiti.toFixed(2)}`;

        // C) Tabella 2: FINANZIAMENTI (Nuova Logica Parallelizzata)
        let totaleRimanenzeFinanziamenti = 0;
        document.querySelectorAll('#fin-table-body .fin-row').forEach((riga, index) => {
            const campoNome = riga.querySelector('.fin-name');
            const campoFinanziaria = riga.querySelector('.fin-company');
            const campoDovuto = riga.querySelector('.fin-dovuto');
            const campoUscite = riga.querySelector('.fin-uscite');
            const campoEntrate = riga.querySelector('.fin-entrate');
            const campoRimanenza = riga.querySelector('.fin-rimanenza');

            const storiaPassata = calcolaRimanenzaStoricaFinanziamenti(index, dataSelezionata);
            
            if (!haDatiSalvatiOggi && campoNome.value.trim() === "" && storiaPassata && storiaPassata.rimanenza !== 0) {
                campoNome.value = storiaPassata.nome;
                campoFinanziaria.value = storiaPassata.finanziaria || "";
            }

            const nomeAttuale = campoNome ? campoNome.value : "";
            let saldoEreditato = (storiaPassata && storiaPassata.rimanenza !== 0) ? storiaPassata.rimanenza : 0;

            campoDovuto.placeholder = saldoEreditato !== 0 ? saldoEreditato.toFixed(2) : "0.00";

            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const rimanenza = dovuto + (parseFloat(campoUscite.value) || 0) - (parseFloat(campoEntrate.value) || 0);

            if (nomeAttuale.trim() === "" && dovuto === 0 && campoUscite.value === "" && campoEntrate.value === "") {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                totaleRimanenzeFinanziamenti += rimanenza > 0 ? rimanenza : 0;
            }
        });
        const finTotaleEl = document.getElementById('page-fin-total');
        if (finTotaleEl) finTotaleEl.textContent = `€ ${totaleRimanenzeFinanziamenti.toFixed(2)}`;

        // D) Totale Giornata Unificato (Somma Entrate + Prestiti + Finanziamenti)
        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            dailyTotalEl.textContent = `€ ${(totaleEntrate + totaleRimanenzePrestiti + totaleRimanenzeFinanziamenti).toFixed(2)}`;
        }
    }

    // Intercettazione input e cambi di selezione per ricalcoli immediati
    document.addEventListener('input', (e) => {
        if (e.target.matches('.amount-input, .loan-amount-input, .loan-name, .fin-amount-input, .fin-name')) {
            ricalcolaTutto();
        }
    });
    document.addEventListener('change', (e) => {
        if (e.target.matches('.fin-company')) {
            ricalcolaTutto();
        }
    });

    // --- 5. MOTORE SALVATAGGIO COMPLETO ---
    function salvaDatiCorrenti() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        const datiDaSalvare = { stipendi: {}, varie: [], prestiti: [], finanziamenti: [] };

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

        document.querySelectorAll('#loans-table-body .loan-row').forEach((riga, index) => {
            let campoDovuto = riga.querySelector('.loan-dovuto').value;
            if (campoDovuto === "") {
                const storiaPassata = calcolaRimanenzaStoricaPrestiti(index, dataSelezionata);
                if (storiaPassata && storiaPassata.rimanenza !== 0) campoDovuto = storiaPassata.rimanenza.toString();
            }
            datiDaSalvare.prestiti.push({
                nome: riga.querySelector('.loan-name').value,
                nota: riga.querySelector('.loan-note').value,
                dovuto: campoDovuto, 
                uscite: riga.querySelector('.loan-uscite').value,
                entrate: riga.querySelector('.loan-entrate').value
            });
        });

        document.querySelectorAll('#fin-table-body .fin-row').forEach((riga, index) => {
            let campoDovuto = riga.querySelector('.fin-dovuto').value;
            if (campoDovuto === "") {
                const storiaPassata = calcolaRimanenzaStoricaFinanziamenti(index, dataSelezionata);
                if (storiaPassata && storiaPassata.rimanenza !== 0) campoDovuto = storiaPassata.rimanenza.toString();
            }
            datiDaSalvare.finanziamenti.push({
                nome: riga.querySelector('.fin-name').value,
                finanziaria: riga.querySelector('.fin-company').value,
                nota: riga.querySelector('.fin-note').value,
                dovuto: campoDovuto, 
                uscite: riga.querySelector('.fin-uscite').value,
                entrate: riga.querySelector('.fin-entrate').value
            });
        });

        localStorage.setItem(`dati_${dataSelezionata}`, JSON.stringify(datiDaSalvare));
    }

    function caricaDatiData() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        document.querySelectorAll('main select').forEach(s => s.value = "");
        document.querySelectorAll('main input[type="text"]').forEach(i => i.value = "");
        document.querySelectorAll('main input[type="number"]').forEach(n => n.value = "");

        const datiSalvati = localStorage.getItem(`dati_${dataSelezionata}`);

        if (datiSalvati) {
            const dati = JSON.parse(datiSalvati);

            if (dati.stipendi) {
                righeFisse.forEach(id => {
                    const riga = document.getElementById(id);
                    if (riga && dati.stipendi[id]) {
                        if (riga.querySelector('select')) riga.querySelector('select').value = dati.stipendi[id].mese;
                        if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.stipendi[id].nota;
                        if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.stipendi[id].cifra;
                    }
                });
            }

            if (dati.varie) {
                document.querySelectorAll('#page-entrate .row-varie').forEach((riga, index) => {
                    if (dati.varie[index]) {
                        if (riga.querySelector('select')) riga.querySelector('select').value = dati.varie[index].categoria;
                        if (riga.querySelector('.note-input')) riga.querySelector('.note-input').value = dati.varie[index].nota;
                        if (riga.querySelector('.amount-input')) riga.querySelector('.amount-input').value = dati.varie[index].cifra;
                    }
                });
            }

            if (dati.prestiti) {
                document.querySelectorAll('#loans-table-body .loan-row').forEach((riga, index) => {
                    if (dati.prestiti[index]) {
                        riga.querySelector('.loan-name').value = dati.prestiti[index].nome || "";
                        riga.querySelector('.loan-note').value = dati.prestiti[index].nota || "";
                        riga.querySelector('.loan-dovuto').value = dati.prestiti[index].dovuto || "";
                        riga.querySelector('.loan-uscite').value = dati.prestiti[index].uscite || "";
                        riga.querySelector('.loan-entrate').value = dati.prestiti[index].entrate || "";
                    }
                });
            }

            if (dati.finanziamenti) {
                document.querySelectorAll('#fin-table-body .fin-row').forEach((riga, index) => {
                    if (dati.finanziamenti[index]) {
                        riga.querySelector('.fin-name').value = dati.finanziamenti[index].nome || "";
                        riga.querySelector('.fin-company').value = dati.finanziamenti[index].finanziaria || "";
                        riga.querySelector('.fin-note').value = dati.finanziamenti[index].nota || "";
                        riga.querySelector('.fin-dovuto').value = dati.finanziamenti[index].dovuto || "";
                        riga.querySelector('.fin-uscite').value = dati.finanziamenti[index].uscite || "";
                        riga.querySelector('.fin-entrate').value = dati.finanziamenti[index].entrate || "";
                    }
                });
            }
        }

        ricalcolaTutto();
    }

    if (dateInput) dateInput.addEventListener('change', caricaDatiData);

    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            salvaDatiCorrenti();
            alert(`Dati del giorno ${dateInput.value} salvati con successo!`);
        });
    }
    if (printBtn) printBtn.addEventListener('click', () => { window.print(); });

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
