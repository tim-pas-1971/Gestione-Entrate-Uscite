document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. COMPILAZIONE RIGHE FISSE (ENTRATE E USCITE) ---
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

    const righeFisseEntrate = ['row-naspi-luigi', 'row-naspi-tiziana', 'row-pensione-luigi', 
                               'row-pensione-tiziana', 'row-stipendio-luigi', 'row-stipendio-tiziana'];
    righeFisseEntrate.forEach(inizializzaRigaFissa);

    function inizializzaRigaUscitaFissa(id) {
        const riga = document.getElementById(id);
        if (!riga) return;

        const select = document.createElement('select');
        select.className = 'period-select';
        mesi.slice(0, 13).forEach((m, index) => {
            if (index === 0) {
                select.innerHTML += `<option value="">${m}</option>`;
            } else {
                select.innerHTML += `<option value="${m}">${m}</option>`;
            }
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'amount-wrapper wrapper-ocra';
        wrapper.innerHTML = '<input type="number" step="0.01" class="amount-input-ocra" placeholder="0.00">';

        riga.appendChild(select);
        riga.appendChild(wrapper);
    }

    const righeFisseUscite = [
        'row-spesa-alimenti', 
        'row-spese-personali', 
        'row-spese-ristoranti', 
        'row-spese-salute', 
        'row-spese-gatti', 
        'row-gestione-casa', 
        'row-gestione-auto', 
        'row-varie-imprevisti'
    ];
    righeFisseUscite.forEach(inizializzaRigaUscitaFissa);

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

    // --- 3. MOTORI DI RICERCA CRONOLOGICA ---
    function calcolaRimanenzaStoricaPrestiti(indiceRiga, dataTarget) {
        let nomeTrovato = "";
        let notaTrovata = "";
        let debitoResiduo = 0;
        let haTrovatoStoria = false;

        for (let i = 1; i <= 365; i++) {
            const dataStr = sottraiGiorni(dataTarget, i);
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);

            if (datiSalvati) {
                const dati = JSON.parse(datiSalvati);
                if (dati.prestiti && dati.prestiti[indiceRiga]) {
                    const p = dati.prestiti[indiceRiga];
                    if ((p.nome && p.nome.trim() !== "") || p.nota || p.dovuto || p.uscite || p.entrate) {
                        if (!nomeTrovato && p.nome && p.nome.trim() !== "") nomeTrovato = p.nome;
                        if (!notaTrovata && p.nota && p.nota.trim() !== "") notaTrovata = p.nota;
                        
                        const saldoPrec = calcolaRimanenzaStoricaPrestiti(indiceRiga, dataStr);
                        const dovuto = p.dovuto !== "" ? (parseFloat(p.dovuto) || 0) : (saldoPrec ? saldoPrec.rimanenza : 0);
                        debitoResiduo = dovuto + (parseFloat(p.uscite) || 0) - (parseFloat(p.entrate) || 0);
                        
                        if (!nomeTrovato && saldoPrec) nomeTrovato = saldoPrec.nome;
                        if (!notaTrovata && saldoPrec) notaTrovata = saldoPrec.nota;
                        haTrovatoStoria = true;
                        break;
                    }
                }
            }
        }
        return haTrovatoStoria ? { nome: nomeTrovato, nota: notaTrovata, rimanenza: debitoResiduo } : null;
    }

    function calcolaRimanenzaStoricaFinanziamenti(indiceRiga, dataTarget) {
        let nomeTrovato = "";
        let finanziariaTrovata = "";
        let notaTrovata = "";
        let debitoResiduo = 0;
        let haTrovatoStoria = false;

        for (let i = 1; i <= 365; i++) {
            const dataStr = sottraiGiorni(dataTarget, i);
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);

            if (datiSalvati) {
                const dati = JSON.parse(datiSalvati);
                if (dati.finanziamenti && dati.finanziamenti[indiceRiga]) {
                    const f = dati.finanziamenti[indiceRiga];
                    if ((f.nome && f.nome.trim() !== "") || f.finanziaria || f.nota || f.dovuto || f.uscite || f.entrate) {
                        if (!nomeTrovato && f.nome && f.nome.trim() !== "") nomeTrovato = f.nome;
                        if (!finanziariaTrovata && f.finanziaria) finanziariaTrovata = f.finanziaria;
                        if (!notaTrovata && f.nota && f.nota.trim() !== "") notaTrovata = f.nota;
                        
                        const saldoPrec = calcolaRimanenzaStoricaFinanziamenti(indiceRiga, dataStr);
                        const dovuto = f.dovuto !== "" ? (parseFloat(f.dovuto) || 0) : (saldoPrec ? saldoPrec.rimanenza : 0);
                        debitoResiduo = dovuto + (parseFloat(f.uscite) || 0) - (parseFloat(f.entrate) || 0);
                        
                        if (!nomeTrovato && saldoPrec) nomeTrovato = saldoPrec.nome;
                        if (!finanziariaTrovata && saldoPrec) finanziariaTrovata = saldoPrec.finanziaria;
                        if (!notaTrovata && saldoPrec) notaTrovata = saldoPrec.nota;
                        haTrovatoStoria = true;
                        break;
                    }
                }
            }
        }
        return haTrovatoStoria ? { nome: nomeTrovato, finanziaria: finanziariaTrovata, nota: notaTrovata, rimanenza: debitoResiduo } : null;
    }

    // --- 3. MOTORI DI RICERCA CRONOLOGICA (Estratto corretto) ---
function calcolaRimanenzaStoricaPersonale(indiceRiga, dataTarget) {
        let finanziariaTrovata = "";
        let notaTrovata = "";
        let debitoResiduo = 0;
        let haTrovatoStoria = false;

        // Scansione a ritroso nei 365 giorni precedenti
        for (let i = 1; i <= 365; i++) {
            const dataStr = sottraiGiorni(dataTarget, i);
            const datiSalvati = localStorage.getItem(`dati_${dataStr}`);

            if (datiSalvati) {
                try {
                    const dati = JSON.parse(datiSalvati);
                    if (dati.personale && dati.personale[indiceRiga]) {
                        const pers = dati.personale[indiceRiga];
                        
                        // Verifica se nel giorno passato c'erano dati registrati
                        if (pers.finanziaria || pers.nota || pers.dovuto || pers.uscite || pers.entrate) {
                            if (!finanziariaTrovata && pers.finanziaria) finanziariaTrovata = pers.finanziaria;
                            if (!notaTrovata && pers.nota && pers.nota.trim() !== "") notaTrovata = pers.nota;
                            
                            // Continua la catena a ritroso per ereditare correttamente il saldo di partenza
                            const saldoPrec = calcolaRimanenzaStoricaPersonale(indiceRiga, dataStr);
                            const dovuto = pers.dovuto !== "" ? (parseFloat(pers.dovuto) || 0) : (saldoPrec ? saldoPrec.rimanenza : 0);
                            
                            // Formula specifica per i finanziamenti personali
                            debitoResiduo = dovuto - (parseFloat(pers.uscite) || 0) + (parseFloat(pers.entrate) || 0);
                            
                            if (!finanziariaTrovata && saldoPrec) finanziariaTrovata = saldoPrec.finanziaria;
                            if (!notaTrovata && saldoPrec) notaTrovata = saldoPrec.nota;
                            
                            haTrovatoStoria = true;
                            break; // Trovato il punto di contatto più recente, interrompe il ciclo
                        }
                    }
                } catch(e) {}
            }
        }
        return haTrovatoStoria ? { finanziaria: finanziariaTrovata, nota: notaTrovata, rimanenza: debitoResiduo } : null;
    }

    // --- 4. LOGICA DEI CALCOLI AUTOMATICI CON SCRITTURA REALE DELLE NOTE ---
    function ricalcolaTutto() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        let totaleEntrateGenerali = 0;
        document.querySelectorAll('#page-entrate .amount-input').forEach(input => {
            totaleEntrateGenerali += parseFloat(input.value) || 0;
        });
        const entrateTotaleEl = document.getElementById('page-entrate-total');
        if (entrateTotaleEl) entrateTotaleEl.textContent = `€ ${totaleEntrateGenerali.toFixed(2)}`;

        const datiSalvatiDelGiorno = localStorage.getItem(`dati_${dataSelezionata}`);
        const haDatiSalvatiOggi = datiSalvatiDelGiorno !== null;

        let uscitePrestitiGiorno = 0;
        let entratePrestitiGiorno = 0;

        document.querySelectorAll('#loans-table-body .loan-row').forEach((riga, index) => {
            const campoNome = riga.querySelector('.loan-name');
            const campoNota = riga.querySelector('.loan-note');
            const campoDovuto = riga.querySelector('.loan-dovuto');
            const campoUscites = riga.querySelector('.loan-uscite');
            const campoEntrate = riga.querySelector('.loan-entrate');
            const campoRimanenza = riga.querySelector('.loan-rimanenza');

            const storiaPassata = calcolaRimanenzaStoricaPrestiti(index, dataSelezionata);
            
            if (!haDatiSalvatiOggi && storiaPassata && storiaPassata.rimanenza !== 0) {
                if (campoNome.value.trim() === "") campoNome.value = storiaPassata.nome || "";
                if (campoNota.value.trim() === "") campoNota.value = storiaPassata.nota || "";
            }

            const nomeAttuale = campoNome ? campoNome.value : "";
            let saldoEreditato = (storiaPassata && storiaPassata.rimanenza !== 0) ? storiaPassata.rimanenza : 0;
            campoDovuto.placeholder = saldoEreditato !== 0 ? saldoEreditato.toFixed(2) : "0.00";

            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const u = parseFloat(campoUscites.value) || 0;
            const e = parseFloat(campoEntrate.value) || 0;
            const rimanenza = dovuto + u - e;

            if (nomeAttuale.trim() === "" && dovuto === 0 && u === 0 && e === 0) {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                uscitePrestitiGiorno += u;
                entratePrestitiGiorno += e;
            }
        });

        document.querySelectorAll('#fin-table-body .fin-row').forEach((riga, index) => {
            const campoNome = riga.querySelector('.fin-name');
            const campoFinanziaria = riga.querySelector('.fin-company');
            const campoNota = riga.querySelector('.fin-note');
            const campoDovuto = riga.querySelector('.fin-dovuto');
            const campoUscites = riga.querySelector('.fin-uscite');
            const campoEntrate = riga.querySelector('.fin-entrate');
            const campoRimanenza = riga.querySelector('.fin-rimanenza');

            const storiaPassata = calcolaRimanenzaStoricaFinanziamenti(index, dataSelezionata);
            
            if (!haDatiSalvatiOggi && storiaPassata && storiaPassata.rimanenza !== 0) {
                if (campoNome.value.trim() === "") campoNome.value = storiaPassata.nome || "";
                if (campoFinanziaria.value === "") campoFinanziaria.value = storiaPassata.finanziaria || "";
                if (campoNota.value.trim() === "") campoNota.value = storiaPassata.nota || "";
            }

            const nomeAttuale = campoNome ? campoNome.value : "";
            let saldoEreditato = (storiaPassata && storiaPassata.rimanenza !== 0) ? storiaPassata.rimanenza : 0;
            campoDovuto.placeholder = saldoEreditato !== 0 ? saldoEreditato.toFixed(2) : "0.00";

            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const u = parseFloat(campoUscites.value) || 0;
            const e = parseFloat(campoEntrate.value) || 0;
            const rimanenza = dovuto + u - e;

            if (nomeAttuale.trim() === "" && dovuto === 0 && u === 0 && e === 0) {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                uscitePrestitiGiorno += u;
                entratePrestitiGiorno += e;
            }
        });

        const p2UsciteEl = document.getElementById('page-loans-total-uscite');
        const p2EntrateEl = document.getElementById('page-loans-total-entrate');
        if (p2UsciteEl) p2UsciteEl.textContent = `€ ${uscitePrestitiGiorno.toFixed(2)}`;
        if (p2EntrateEl) p2EntrateEl.textContent = `€ ${entratePrestitiGiorno.toFixed(2)}`;

        let uscitePersonaleGiorno = 0;
        let entratePersonaleGiorno = 0;

        document.querySelectorAll('#personale-table-body .pers-row').forEach((riga, index) => {
            const campoFinanziaria = riga.querySelector('.pers-company');
            const campoNota = riga.querySelector('.pers-note');
            const campoDovuto = riga.querySelector('.pers-dovuto');
            const campoUscites = riga.querySelector('.pers-uscite'); 
            const campoEntrate = riga.querySelector('.pers-entrate');
            const campoRimanenza = riga.querySelector('.pers-rimanenza');

            const storiaPassata = calcolaRimanenzaStoricaPersonale(index, dataSelezionata);
            
            if (!haDatiSalvatiOggi && storiaPassata && storiaPassata.rimanenza !== 0) {
                if (campoFinanziaria.value === "") campoFinanziaria.value = storiaPassata.finanziaria || "";
                if (campoNota.value.trim() === "") campoNota.value = storiaPassata.nota || "";
            }

            const finAttuale = campoFinanziaria ? campoFinanziaria.value : "";
            let saldoEreditato = (storiaPassata && storiaPassata.rimanenza !== 0) ? storiaPassata.rimanenza : 0;
            campoDovuto.placeholder = saldoEreditato !== 0 ? saldoEreditato.toFixed(2) : "0.00";

            const dovuto = campoDovuto.value !== "" ? (parseFloat(campoDovuto.value) || 0) : saldoEreditato;
            const u = parseFloat(campoUscites.value) || 0;
            const e = parseFloat(campoEntrate.value) || 0;
            const rimanenza = dovuto - u + e;

            if (finAttuale === "" && dovuto === 0 && u === 0 && e === 0) {
                if (campoRimanenza) campoRimanenza.value = "0.00";
            } else {
                if (campoRimanenza) campoRimanenza.value = rimanenza.toFixed(2);
                uscitePersonaleGiorno += u;
                entratePersonaleGiorno += e;
            }
        });

        const p3UsciteEl = document.getElementById('page-personale-total-uscite');
        const p3EntrateEl = document.getElementById('page-personale-total-entrate');
        if (p3UsciteEl) p3UsciteEl.textContent = `€ ${uscitePersonaleGiorno.toFixed(2)}`;
        if (p3EntrateEl) p3EntrateEl.textContent = `€ ${entratePersonaleGiorno.toFixed(2)}`;

        let totaleUsciteGenerali = 0;
        document.querySelectorAll('#page-uscite .amount-input-ocra').forEach(input => {
            totaleUsciteGenerali += parseFloat(input.value) || 0;
        });
        const usciteTotaleEl = document.getElementById('page-uscite-total');
        if (usciteTotaleEl) usciteTotaleEl.textContent = `€ ${totaleUsciteGenerali.toFixed(2)}`;

        const dailyTotalEl = document.getElementById('daily-total');
        if (dailyTotalEl) {
            const tutteLeEntrateDelGiorno = totaleEntrateGenerali + entratePrestitiGiorno + entratePersonaleGiorno;
            const tutteLeUsciteDelGiorno = totaleUsciteGenerali + uscitePrestitiGiorno + uscitePersonaleGiorno;
            const bilancioGiornata = tutteLeEntrateDelGiorno - tutteLeUsciteDelGiorno;
            dailyTotalEl.textContent = `€ ${bilancioGiornata.toFixed(2)}`;
        }

        if (document.getElementById('page-uscite').style.display === 'block') {
            calcolaSuperTotaleUsciteAnnuali();
        }
    }

    document.addEventListener('input', (e) => {
        if (e.target.matches('.amount-input, .loan-amount-input, .loan-name, .loan-note, .fin-amount-input, .fin-name, .fin-note, .pers-amount-input, .pers-note, .amount-input-ocra')) {
            ricalcolaTutto();
        }
    });
    document.addEventListener('change', (e) => {
        if (e.target.matches('.fin-company, .pers-company, #page-uscite .period-select')) {
            ricalcolaTutto();
        }
    });

    // --- 5. MOTORE SALVATAGGIO CENTRALIZZATO ---
    function salvaDatiCorrenti() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        // Struttura dati base con il nuovo campo per la nota di sezione delle entrate fisse
        const datiDaSalvare = { stipendi: {}, notaSezioneFissa: "", varie: [], prestiti: [], finanziamenti: [], personale: [], uscite: {} };

        // Salva il testo libero della nuova area note
        const campoNotaFissaTextarea = document.getElementById('note-entrate-fisse');
        if (campoNotaFissaTextarea) {
            datiDaSalvare.notaSezioneFissa = campoNotaFissaTextarea.value;
        }

        righeFisseEntrate.forEach(id => {
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
            let testoNota = riga.querySelector('.loan-note').value;
            if (testoNota === "") {
                const storiaPassata = calcolaRimanenzaStoricaPrestiti(index, dataSelezionata);
                if (storiaPassata && storiaPassata.nota) testoNota = storiaPassata.nota;
            }
            
            datiDaSalvare.prestiti.push({
                nome: riga.querySelector('.loan-name').value,
                nota: testoNota,
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
            let testoNota = riga.querySelector('.fin-note').value;
            if (testoNota === "") {
                const storiaPassata = calcolaRimanenzaStoricaFinanziamenti(index, dataSelezionata);
                if (storiaPassata && storiaPassata.nota) testoNota = storiaPassata.nota;
            }
            
            datiDaSalvare.finanziamenti.push({
                nome: riga.querySelector('.fin-name').value,
                finanziaria: riga.querySelector('.fin-company').value,
                nota: testoNota,
                dovuto: campoDovuto, 
                uscite: riga.querySelector('.fin-uscite').value,
                entrate: riga.querySelector('.fin-entrate').value
            });
        });

        document.querySelectorAll('#personale-table-body .pers-row').forEach((riga, index) => {
            let campoDovuto = riga.querySelector('.pers-dovuto').value;
            if (campoDovuto === "") {
                const storiaPassata = calcolaRimanenzaStoricaPersonale(index, dataSelezionata);
                if (storiaPassata && storiaPassata.rimanenza !== 0) campoDovuto = storiaPassata.rimanenza.toString();
            }
            let testoNota = riga.querySelector('.pers-note').value;
            if (testoNota === "") {
                const storiaPassata = calcolaRimanenzaStoricaPersonale(index, dataSelezionata);
                if (storiaPassata && storiaPassata.nota) testoNota = storiaPassata.nota;
            }
            
            datiDaSalvare.personale.push({
                finanziaria: riga.querySelector('.pers-company').value,
                nota: testoNota,
                dovuto: campoDovuto, 
                uscite: riga.querySelector('.pers-uscite').value,
                entrate: riga.querySelector('.pers-entrate').value
            });
        });

        righeFisseUscite.forEach(id => {
            const riga = document.getElementById(id);
            if (riga) {
                datiDaSalvare.uscite[id] = {
                    mese: riga.querySelector('select')?.value || "",
                    cifra: riga.querySelector('.amount-input-ocra')?.value || ""
                };
            }
        });

        localStorage.setItem(`dati_${dataSelezionata}`, JSON.stringify(datiDaSalvare));
    }

    function caricaDatiData() {
        const dataSelezionata = dateInput.value;
        if (!dataSelezionata) return;

        // PULIZIA SELETTIVA COMPLETA: svuota gli input di testo, cifre e la nuova textarea
        document.querySelectorAll('main input[type="text"]').forEach(i => i.value = "");
        document.querySelectorAll('main input[type="number"]').forEach(n => n.value = "");
        const campoNotaFissaTextarea = document.getElementById('note-entrate-fisse');
        if (campoNotaFissaTextarea) campoNotaFissaTextarea.value = "";
        
        // Resetta i menu a tendina tranne i selettori generali dell'anno
        document.querySelectorAll('main select').forEach(s => {
            if (s.id !== 'revenue-year-select' && s.id !== 'expenses-year-select') {
                s.value = "";
            }
        });

        const datiSalvati = localStorage.getItem(`dati_${dataSelezionata}`);

        if (datiSalvati) {
            const dati = JSON.parse(datiSalvati);

            // Ricarica la nuova nota di sezione se salvata
            if (dati.notaSezioneFissa && campoNotaFissaTextarea) {
                campoNotaFissaTextarea.value = dati.notaSezioneFissa;
            }

            if (dati.stipendi) {
                righeFisseEntrate.forEach(id => {
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

            if (dati.personale) {
                document.querySelectorAll('#personale-table-body .pers-row').forEach((riga, index) => {
                    if (dati.personale[index]) {
                        riga.querySelector('.pers-company').value = dati.personale[index].finanziaria || "";
                        riga.querySelector('.pers-note').value = dati.personale[index].nota || "";
                        riga.querySelector('.pers-dovuto').value = dati.personale[index].dovuto || "";
                        riga.querySelector('.pers-uscite').value = dati.personale[index].uscite || "";
                        riga.querySelector('.pers-entrate').value = dati.personale[index].entrate || "";
                    }
                });
            }

            if (dati.uscite) {
                righeFisseUscite.forEach(id => {
                    const riga = document.getElementById(id);
                    if (riga && dati.uscite[id]) {
                        if (riga.querySelector('select')) riga.querySelector('select').value = dati.uscite[id].mese;
                        if (riga.querySelector('.amount-input-ocra')) riga.querySelector('.amount-input-ocra').value = dati.uscite[id].cifra;
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
    if (printBtn) {
        printBtn.addEventListener('click', () => { window.print(); });
    }

    // --- 6. EXPORT E IMPORT JSON ---
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const tuttoIlDatabase = {};
            for (let i = 0; i < localStorage.length; i++) {
                const chiave = localStorage.key(i);
                if (chiave.startsWith('dati_')) {
                    tuttoIlDatabase[chiave] = localStorage.getItem(chiave);
                }
            }
            const stringaDati = JSON.stringify(tuttoIlDatabase, null, 4);
            const blob = new Blob([stringaDati], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const dataOggi = dateInput.value || 'backup';
            const linkTemporaneo = document.createElement('a');
            linkTemporaneo.href = url;
            linkTemporaneo.download = `backup_casa_${dataOggi}.json`;
            document.body.appendChild(linkTemporaneo);
            linkTemporaneo.click();
            document.body.removeChild(linkTemporaneo);
            URL.revokeObjectURL(url);
        });
    }

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => { importFileInput.click(); });
        importFileInput.addEventListener('change', (evento) => {
            const file = evento.target.files[0];
            if (!file) return;
            const lettore = new FileReader();
            lettore.onload = (e) => {
                try {
                    const datiImportati = JSON.parse(e.target.result);
                    if (Object.keys(datiImportati).length === 0) {
                        alert("Il file selezionato è vuoto o non contiene dati validi.");
                        return;
                    }
                    if (confirm("Stai per caricare un file di backup esterno. Questo unirà i dati salvati a quelli attuali. Vuoi procedere?")) {
                        Object.keys(datiImportati).forEach(chiave => {
                            if (chiave.startsWith('dati_')) {
                                localStorage.setItem(chiave, datiImportati[chiave]);
                            }
                        });
                        alert("Tutti i dati di sicurezza sono stati ripristinati con successo!");
                        importFileInput.value = '';
                        caricaDatiData();
                        if (document.getElementById('page-riepilogo-entrate').style.display === 'block') {
                            calcolaEdEseguiGraficiEntrate();
                        }
                        if (document.getElementById('page-uscite').style.display === 'block') {
                            calcolaSuperTotaleUsciteAnnuali();
                        }
                    }
                } catch (errore) {
                    alert("Errore critico: Il file selezionato non è un formato JSON valido.");
                    importFileInput.value = '';
                }
            };
            lettore.readAsText(file);
        });
    }

    // --- 7. IMPLEMENTAZIONE COMPLETA DELLA PAGINA RIEPILOGO ENTRATE ANNUALI ---
    let istanzaGraficoBarre = null;
    let istanzaGraficoTorta = null;

    const yearSelectRevenue = document.getElementById('revenue-year-select');
    if (yearSelectRevenue) {
        yearSelectRevenue.addEventListener('change', calcolaEdEseguiGraficiEntrate);
    }

    function calcolaEdEseguiGraficiEntrate() {
        const annoSelezionato = yearSelectRevenue ? yearSelectRevenue.value : "2026";
        const labelAnno = document.getElementById('revenue-total-year-label');
        if (labelAnno) labelAnno.textContent = annoSelezionato;

        const entrateGenPerMese = new Array(12).fill(0);
        const prestitiFamPerMese = new Array(12).fill(0);
        const finanziamentiPersPerMese = new Array(12).fill(0);

        for (let i = 0; i < localStorage.length; i++) {
            const chiave = localStorage.key(i);
            
            if (chiave.includes(annoSelezionato)) {
                try {
                    const datiGiorno = JSON.parse(localStorage.getItem(chiave));
                    if (!datiGiorno) continue;

                    const partiData = chiave.split('-');
                    let meseIndice = -1;
                    if (partiData.length >= 2) { meseIndice = parseInt(partiData[1], 10) - 1; }

                    if (meseIndice >= 0 && meseIndice <= 11) {
                        if (datiGiorno.stipendi) {
                            Object.values(datiGiorno.stipendi).forEach(st => {
                                entrateGenPerMese[meseIndice] += parseFloat(st.cifra) || 0;
                            });
                        }
                        if (datiGiorno.varie) {
                            datiGiorno.varie.forEach(v => {
                                entrateGenPerMese[meseIndice] += parseFloat(v.cifra) || 0;
                            });
                        }
                        if (datiGiorno.prestiti) {
                            datiGiorno.prestiti.forEach(p => {
                                prestitiFamPerMese[meseIndice] += parseFloat(p.entrate) || 0;
                            });
                        }
                        if (datiGiorno.finanziamenti) {
                            datiGiorno.finanziamenti.forEach(f => {
                                prestitiFamPerMese[meseIndice] += parseFloat(f.entrate) || 0;
                            });
                        }
                        if (datiGiorno.personale) {
                            datiGiorno.personale.forEach(pers => {
                                finanziamentiPersPerMese[meseIndice] += parseFloat(pers.entrate) || 0;
                            });
                        }
                    }
                } catch(e) {}
            }
        }

        let totaleComplessivoAnno = 0;
        for (let m = 0; m < 12; m++) {
            const sommaMese = entrateGenPerMese[m] + prestitiFamPerMese[m] + finanziamentiPersPerMese[m];
            totaleComplessivoAnno += sommaMese;

            const cardElemento = document.getElementById(`rev-card-${m}`);
            if (cardElemento) { cardElemento.textContent = `€ ${sommaMese.toFixed(2)}`; }
        }

        const valoreTotaleAnnuoEl = document.getElementById('revenue-annual-total-value');
        if (valoreTotaleAnnuoEl) valoreTotaleAnnuoEl.textContent = `€ ${totaleComplessivoAnno.toFixed(2)}`;
        
        const tortaTitoloEl = document.getElementById('pie-total-anno-title');
        if (tortaTitoloEl) tortaTitoloEl.textContent = `TOTALE ANNO: € ${totaleComplessivoAnno.toFixed(2)}`;

        const totaleEntrateGeneraliPagina = entrateGenPerMese.reduce((a, b) => a + b, 0);
        const totalePrestitiFamiliariPagina = prestitiFamPerMese.reduce((a, b) => a + b, 0);
        const totaleFinanziamentiPersonaliPagina = finanziamentiPersPerMese.reduce((a, b) => a + b, 0);

        if (istanzaGraficoBarre) { istanzaGraficoBarre.destroy(); istanzaGraficoBarre = null; }
        if (istanzaGraficoTorta) { istanzaGraficoTorta.destroy(); istanzaGraficoTorta = null; }

        const ctxBarre = document.getElementById('chart-stacked-bar-revenue');
        if (ctxBarre) {
            istanzaGraficoBarre = new Chart(ctxBarre, {
                type: 'bar',
                data: {
                    labels: ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'],
                    datasets: [
                        { label: 'Entrate Generali', data: entrateGenPerMese, backgroundColor: '#27ae60', stack: 'entrate' },
                        { label: 'Prestiti / Finanziamenti (Familiari)', data: prestitiFamPerMese, backgroundColor: '#e74c3c', stack: 'entrate' },
                        { label: 'Prestiti / Finanziamenti (Personale)', data: finanziamentiPersPerMese, backgroundColor: '#0284c7', stack: 'entrate' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
                }
            });
        }

        const ctxTorta = document.getElementById('chart-pie-revenue');
        if (ctxTorta) {
            istanzaGraficoTorta = new Chart(ctxTorta, {
                type: 'pie',
                data: {
                    labels: ['Entrate Generali', 'Prestiti / Finanziamenti (Familiari)', 'Prestiti / Finanziamenti (Personale)'],
                    datasets: [{
                        data: [totaleEntrateGeneraliPagina, totalePrestitiFamiliariPagina, totaleFinanziamentiPersonaliPagina],
                        backgroundColor: ['#27ae60', '#e74c3c', '#0284c7']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });
        }
    }

    // --- 8. CONTATORE STRUTTURATO PER LE USCITE COMPLESSIVE ---
    const yearSelectExpenses = document.getElementById('expenses-year-select');
    if (yearSelectExpenses) {
        yearSelectExpenses.addEventListener('change', calcolaSuperTotaleUsciteAnnuali);
    }

    function calcolaSuperTotaleUsciteAnnuali() {
        const annoSelezionato = yearSelectExpenses ? yearSelectExpenses.value : "2026";
        let superTotaleUscite = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const chiave = localStorage.key(i);
            
            if (chiave.includes(annoSelezionato)) {
                try {
                    const datiGiorno = JSON.parse(localStorage.getItem(chiave));
                    if (!datiGiorno) continue;

                    if (datiGiorno.uscite) {
                        Object.values(datiGiorno.uscite).forEach(us => {
                            superTotaleUscite += parseFloat(us.cifra) || 0;
                        });
                    }
                    if (datiGiorno.prestiti) {
                        datiGiorno.prestiti.forEach(p => {
                            superTotaleUscite += parseFloat(p.uscite) || 0;
                        });
                    }
                    if (datiGiorno.finanziamenti) {
                        datiGiorno.finanziamenti.forEach(f => {
                            superTotaleUscite += parseFloat(f.uscite) || 0;
                        });
                    }
                    if (datiGiorno.personale) {
                        datiGiorno.personale.forEach(pers => {
                            superTotaleUscite += parseFloat(pers.uscite) || 0;
                        });
                    }
                } catch(e) {}
            }
        }

        const superTotaleUsciteEl = document.getElementById('expenses-complessivo-total-value');
        if (superTotaleUsciteEl) {
            superTotaleUsciteEl.textContent = `€ ${superTotaleUscite.toFixed(2)}`;
        }
    }

    // --- NAVIGAZIONE SIDEBAR ---
    const menuEntrate = document.getElementById('menu-entrate');
    const menuPrestiti = document.getElementById('menu-prestiti');
    const menuPersonale = document.getElementById('menu-personale');
    const menuUsciteGenerali = document.getElementById('menu-uscite-generali');
    const menuRiepilogoEntrate = document.getElementById('menu-riepilogo-entrate');
    const menuRicerche = document.getElementById('menu-ricerche');
    
    function cambiaPagina(idPagina, pulsanteSelezionato) {
        document.querySelectorAll('.page-body').forEach(p => p.style.display = 'none');
        const paginaTarget = document.getElementById(idPagina);
        if (paginaTarget) paginaTarget.style.display = 'block';
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        if (pulsanteSelezionato) pulsanteSelezionato.classList.add('active');

        if (idPagina === 'page-riepilogo-entrate') { calcolaEdEseguiGraficiEntrate(); }
        if (idPagina === 'page-uscite') { calcolaSuperTotaleUsciteAnnuali(); }
    }

    if (menuEntrate) menuEntrate.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-entrate', menuEntrate); });
    if (menuPrestiti) menuPrestiti.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-prestiti', menuPrestiti); });
    if (menuPersonale) menuPersonale.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-personale', menuPersonale); });
    if (menuUsciteGenerali) menuUsciteGenerali.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-uscite', menuUsciteGenerali); });
    if (menuRiepilogoEntrate) menuRiepilogoEntrate.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-riepilogo-entrate', menuRiepilogoEntrate); });
    if (menuRicerche) menuRicerche.addEventListener('click', (e) => { e.preventDefault(); cambiaPagina('page-ricerche', menuRicerche); });

    // --- 9. MOTORE DI RICERCA AVANZATA ED ESPORTAZIONE EXCEL ---
    const mappingSottosezioni = {
        stipendi: { "row-naspi-luigi": "NASPI (Luigi)", "row-naspi-tiziana": "NASPI (Tiziana)", "row-pensione-luigi": "PENSIONE (Luigi)", "row-pensione-tiziana": "PENSIONE (Tiziana)", "row-stipendio-luigi": "STIPENDIO (Luigi)", "row-stipendio-tiziana": "STIPENDIO (Tiziana)" },
        varie: { "Gavino Spano": "Gavino Spano", "Gratta&Vinci": "Gratta&Vinci", "Subito.it": "Subito.it", "Vinted": "Vinted", "Altro": "Altro" },
        uscite: { "row-spesa-alimenti": "Alimenti", "row-spese-personali": "Spese personali", "row-spese-ristoranti": "Ristoranti", "row-spese-salute": "Salute", "row-spese-gatti": "Gatti", "row-gestione-casa": "Gestione Casa", "row-gestione-auto": "Gestione Auto", "row-varie-imprevisti": "Varie / Imprevisti" }
    };

    const selRicercaSezione = document.getElementById('search-sezione');
    const selRicercaSottosezione = document.getElementById('search-sottosezione');

    if (selRicercaSezione && selRicercaSottosezione) {
        selRicercaSezione.addEventListener('change', (e) => {
            const val = e.target.value;
            selRicercaSottosezione.innerHTML = '<option value="">Tutte</option>';
            if (mappingSottosezioni[val]) {
                Object.entries(mappingSottosezioni[val]).forEach(([chiave, etichetta]) => {
                    selRicercaSottosezione.innerHTML += `<option value="${chiave}">${etichetta}</option>`;
                });
            } else {
                selRicercaSottosezione.innerHTML = '<option value="">- Non applicabile -</option>';
            }
        });
    }

    const btnRicerca = document.getElementById('btn-esegui-ricerca');
    const btnSvuota = document.getElementById('btn-svuota-ricerca');
    
    if (btnSvuota) {
        btnSvuota.addEventListener('click', () => {
            document.getElementById('search-tipo').value = "";
            document.getElementById('search-sezione').value = "";
            document.getElementById('search-sottosezione').innerHTML = '<option value="">Tutte</option>';
            document.getElementById('search-keyword').value = "";
            document.getElementById('search-date-start').value = "";
            document.getElementById('search-date-end').value = "";
            document.getElementById('search-results-container').style.display = 'none';
        });
    }

    if (btnRicerca) {
        btnRicerca.addEventListener('click', () => {
            const fTipo = document.getElementById('search-tipo').value;
            const fSezione = document.getElementById('search-sezione').value;
            const fSotto = document.getElementById('search-sottosezione').value;
            const fTesto = document.getElementById('search-keyword').value.toLowerCase();
            const fDa = document.getElementById('search-date-start').value;
            const fA = document.getElementById('search-date-end').value;

            let risultati = [];
            let totEntrate = 0;
            let totUscite = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('dati_')) {
                    const dataRecord = key.replace('dati_', '');
                    
                    if (fDa && dataRecord < fDa) continue;
                    if (fA && dataRecord > fA) continue;

                    try {
                        const dati = JSON.parse(localStorage.getItem(key));

                        const addRes = (tipo, sezione, sottoCodice, dettaglio, nota, importoStr) => {
                            const importoNum = parseFloat(importoStr) || 0;
                            if (importoNum > 0) {
                                risultati.push({ data: dataRecord, tipo, sezione, sottoCodice, dettaglio, nota: nota || "", importo: importoNum });
                            }
                        };

                        if (dati.stipendi) { Object.keys(dati.stipendi).forEach(id => { addRes('entrata', 'stipendi', id, mappingSottosezioni.stipendi[id], dati.stipendi[id].nota, dati.stipendi[id].cifra); }); }
                        if (dati.varie) { dati.varie.forEach(v => { addRes('entrata', 'varie', v.categoria, v.categoria, v.nota, v.cifra); }); }
                        if (dati.prestiti) { dati.prestiti.forEach(p => { addRes('uscita', 'prestiti', 'p_us', p.nome, p.nota, p.uscite); addRes('entrata', 'prestiti', 'p_en', p.nome, p.nota, p.entrate); }); }
                        if (dati.finanziamenti) { dati.finanziamenti.forEach(f => { const desc = f.finanziaria ? `${f.nome} (${f.finanziaria})` : f.nome; addRes('uscita', 'finanziamenti', f.finanziaria, desc, f.nota, f.uscite); addRes('entrata', 'finanziamenti', f.finanziaria, desc, f.nota, f.entrate); }); }
                        if (dati.personale) { dati.personale.forEach(p => { addRes('uscita', 'personale', p.finanziaria, p.finanziaria, p.nota, p.uscite); addRes('entrata', 'personale', p.finanziaria, p.finanziaria, p.nota, p.entrate); }); }
                        if (dati.uscite) { Object.keys(dati.uscite).forEach(id => { addRes('uscita', 'uscite', id, mappingSottosezioni.uscite[id], "", dati.uscite[id].cifra); }); }

                    } catch(e) {}
                }
            }

            // APPLICAZIONE FILTRI INCROCIATI
            risultati = risultati.filter(r => {
                if (fTipo && r.tipo !== fTipo) return false;
                if (fSezione && r.sezione !== fSezione) return false;
                if (fSotto && r.sottoCodice !== fSotto) return false;
                if (fTesto && !r.dettaglio.toLowerCase().includes(fTesto) && !r.nota.toLowerCase().includes(fTesto)) return false;
                return true;
            });

            // ORDINAMENTO CRONOLOGICO
            risultati.sort((a, b) => b.data.localeCompare(a.data));

            const tbody = document.getElementById('search-results-body');
            tbody.innerHTML = '';
            
            if (risultati.length === 0) {
                document.getElementById('search-no-results').style.display = 'block';
                document.getElementById('btn-export-excel').style.display = 'none';
            } else {
                document.getElementById('search-no-results').style.display = 'none';
                document.getElementById('btn-export-excel').style.display = 'block';
                
                const formattaTesto = (sezioneCod) => {
                    const mappa = { stipendi: "Naspi / ...", varie: "Varie", prestiti: "Prestiti", finanziamenti: "Fin. Terzi", personale: "Fin. Personali", uscite: "Spese Fisse" };
                    return mappa[sezioneCod] || sezioneCod;
                };

                risultati.forEach(r => {
                    if (r.tipo === 'entrata') totEntrate += r.importo;
                    if (r.tipo === 'uscita') totUscite += r.importo;

                    const coloreTxt = r.tipo === 'entrata' ? '#27ae60' : '#e74c3c';
                    const labelTipo = r.tipo === 'entrata' ? 'ENTRATA' : 'USCITA';
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid #e2e8f0';
                    tr.innerHTML = `
                        <td style="padding: 12px 20px;">${r.data.split('-').reverse().join('/')}</td>
                        <td style="padding: 12px 20px; font-weight: 800; color: ${coloreTxt};">${labelTipo}</td>
                        <td style="padding: 12px 20px; font-weight: bold; color: #475569;">${formattaTesto(r.sezione)}</td>
                        <td style="padding: 12px 20px;">${r.dettaglio}</td>
                        <td style="padding: 12px 20px; font-style: italic; color: #64748b;">${r.nota}</td>
                        <td style="padding: 12px 20px; text-align: right; font-weight: 900; color: #0f172a;">€ ${r.importo.toFixed(2)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            document.getElementById('search-tot-entrate').textContent = `€ ${totEntrate.toFixed(2)}`;
            document.getElementById('search-tot-uscite').textContent = `€ ${totUscite.toFixed(2)}`;
            document.getElementById('search-results-container').style.display = 'block';
        });
    }

    // ESPORTAZIONE EXCEL (Formato CSV salvato in UTF-8 per accenti e simbolo €)
    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const rows = document.querySelectorAll('#search-results-body tr');
            if (rows.length === 0) return;

            let csvContent = "\uFEFFDATA;TIPO MOVIMENTO;SEZIONE;DETTAGLIO;NOTE;IMPORTO\n";
            
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                const dataStr = cols[0].innerText;
                const tipoStr = cols[1].innerText;
                const sezStr = cols[2].innerText;
                const detStr = cols[3].innerText.replace(/;/g, ","); 
                const notaStr = cols[4].innerText.replace(/;/g, ",");
                const impStr = cols[5].innerText.replace('€', '').trim().replace('.', ','); 
                
                csvContent += `${dataStr};${tipoStr};${sezStr};${detStr};${notaStr};${impStr}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Ricerca_Gestione_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    caricaDatiData();
});
