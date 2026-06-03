document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('global-date');
    const dailyTotalEl = document.getElementById('daily-total');
    const saveBtn = document.getElementById('save-btn');
    const printBtn = document.getElementById('print-btn');
    const amountInputs = document.querySelectorAll('.amount-input');

    // 1. IMPOSTA LA DATA CORRENTE ALL'AVVIO
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // 2. FUNZIONE PER CALCOLARE IL TOTALE IN TEMPO REALE
    function calculateDailyTotal() {
        let total = 0;
        amountInputs.forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                total += value;
            }
        });
        // Aggiorna il testo in alto formattandolo come valuta (€)
        dailyTotalEl.textContent = `€ ${total.toFixed(2)}`;
    }

    // Ascolta i cambiamenti su tutti i campi di input dell'importo
    amountInputs.forEach(input => {
        input.addEventListener('input', calculateDailyTotal);
    });

    // 3. FUNZIONE PER RECUPERARE E COMPILARE I DATI SALVATI QUANDO CAMBIA LA DATA
    function loadSavedData() {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Puliamo prima tutti i campi
        document.getElementById('entrate-form').reset();
        
        // Cerchiamo se ci sono dati salvati per questa data nel localStorage
        const savedData = localStorage.getItem(`entrate_${selectedDate}`);
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Ripristiniamo i valori dei campi usando un indice sequenziale
            const allInputsAndSelects = document.querySelectorAll('#entrate-form input, #entrate-form select');
            allInputsAndSelects.forEach((element, index) => {
                if (data[index] !== undefined) {
                    element.value = data[index];
                }
            });
        }
        
        // Ricalcoliamo il totale per la data selezionata
        calculateDailyTotal();
    }

    // Ricarica i dati se l'utente cambia la data nel calendario
    dateInput.addEventListener('change', loadSavedData);

    // 4. GESTIONE DEL SALVATAGGIO (TASTO SALVA)
    saveBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert('Per favore, seleziona una data valida.');
            return;
        }

        // Creiamo un array con lo stato di tutti i campi del modulo
        const dataToSave = [];
        const allInputsAndSelects = document.querySelectorAll('#entrate-form input, #entrate-form select');
        
        allInputsAndSelects.forEach(element => {
            dataToSave.push(element.value);
        });

        // Salviamo nel localStorage associandolo alla data specifica
        localStorage.setItem(`entrate_${selectedDate}`, JSON.stringify(dataToSave));
        
        alert(`Dati del giorno ${selectedDate.split('-').reverse().join('/')} salvati con successo!`);
    });

    // 5. GESTIONE DELLA STAMPA (TASTO STAMPA)
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Esegui un primo controllo al caricamento se ci fossero già dati
    loadSavedData();
});
