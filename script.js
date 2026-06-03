document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('global-date');
    const dailyTotalEl = document.getElementById('daily-total');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const form = document.getElementById('entrate-form');

    // 1. IMPOSTA LA DATA DI OGGI IN AUTOMATICO
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // 2. CALCOLO DEL TOTALE GIORNALIERO IN TEMPO REALE
    function calculateDailyTotal() {
        let total = 0;
        // Seleziona tutti gli input numerici delle entrate presenti nella pagina
        const amountInputs = document.querySelectorAll('.amount-input');
        
        amountInputs.forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                total += value;
            }
        });
        
        // Aggiorna il contatore in alto a destra con la formattazione corretta
        dailyTotalEl.textContent = `€ ${total.toFixed(2)}`;
    }

    // Rimani in ascolto su tutta la pagina: appena digiti un numero, il totale si aggiorna
    form.addEventListener('input', (e) => {
        if (e.target.classList.contains('amount-input')) {
            calculateDailyTotal();
        }
    });

    // 3. CARICAMENTO DEI DATI SALVATI QUANDO SI CAMBIA DATA
    function loadSavedData() {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Svuota tutti i campi del modulo per la nuova compilazione
        form.reset();
        
        // Recupera i dati associati a questa specifica data
        const savedData = localStorage.getItem(`entrate_${selectedDate}`);
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Seleziona tutti gli input e select nello stesso identico ordine dell'HTML
            const allElements = form.querySelectorAll('input, select');
            allElements.forEach((element, index) => {
                if (data[index] !== undefined) {
                    element.value = data[index];
                }
            });
        }
        
        // Ricalcola il totale per la data caricata
        calculateDailyTotal();
    }

    // Ascolta quando l'utente cambia la data dal datario in alto
    dateInput.addEventListener('change', loadSavedData);

    // 4. FUNZIONE DI SALVATAGGIO (TASTO SALVA)
    saveBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert('Per favore, seleziona una data valida.');
            return;
        }

        const dataToSave = [];
        const allElements = form.querySelectorAll('input, select');
        
        // Salva il valore di ogni singola casella di testo o menu a tendina
        allElements.forEach(element => {
            dataToSave.push(element.value);
        });

        // Archivia nel localStorage del browser
        localStorage.setItem(`entrate_${selectedDate}`, JSON.stringify(dataToSave));
        
        // Mostra un avviso pulito con la data in formato italiano (GG/MM/AAAA)
        const dateIT = selectedDate.split('-').reverse().join('/');
        alert(`Dati del giorno ${dateIT} salvati correttamente!`);
    });

    // 5. FUNZIONE DI STAMPA (TASTO STAMPA)
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // 6. GESTIONE ESTETICA DEL MENU LATERALE (Per simulare il clic sulle voci)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Per ora blocchiamo il salto link visto che lavoriamo sulla prima pagina
            e.preventDefault(); 
            
            // Rimuove la classe attiva da tutti e la assegna a quello cliccato
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Opzionale: un piccolo avviso temporaneo per le pagine in costruzione
            if (!item.textContent.includes("Entrate Generali")) {
                alert(`La pagina "${item.textContent.trim().substring(2)}" è in arrivo! Per ora concentriamoci sulle Entrate Generali.`);
            }
        });
    });

    // Esegui il caricamento iniziale (se ci sono già dati salvati per oggi)
    loadSavedData();
});
