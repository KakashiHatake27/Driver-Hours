const entriesContainer = document.getElementById('entries-container');
const addRowBtn = document.getElementById('add-row-btn');
const submitBtn = document.getElementById('submit-btn');
const formContainer = document.getElementById('form-container');
const successContainer = document.getElementById('success-container');
const driverSelect = document.getElementById('drivers');

// 1. Auto-populate today's local date accurately (prevents UTC timezone drift)
const today = new Date();
const offset = today.getTimezoneOffset();
const localDate = new Date(today.getTime() - (offset * 60 * 1000));
const firstDateInput = document.querySelector('.date-input');
if (firstDateInput) {
    firstDateInput.value = localDate.toISOString().split('T')[0];
}

// 2. Add a new mobile entry block
addRowBtn.addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.className = 'entry-row';

    const dateInputs = document.querySelectorAll('.date-input');
    let nextDateStr = '';

    if (dateInputs.length > 0) {
        const lastDateVal = dateInputs[dateInputs.length - 1].value;
        if (lastDateVal) {
            const lastDate = new Date(lastDateVal + 'T00:00:00'); // Forces local timezone evaluation
            lastDate.setDate(lastDate.getDate() + 1);
            nextDateStr = lastDate.toISOString().split('T')[0];
        }
    }

    newRow.innerHTML = `
        <div class="row-date">
            <label>Date</label>
            <input type="date" class="date-input" value="${nextDateStr}" required>
        </div>
        <div class="row-hours">
            <label>Hours Worked</label>
            <input type="number" class="hours-input" min="0" max="250" step="0.5" inputmode="decimal" value="12" required>
        </div>
        <div class="row-delete">
            <button type="button" class="btn-delete" onclick="deleteRow(this)">
                Remove This Day
            </button>
        </div>
    `;

    entriesContainer.appendChild(newRow);

    // Smooth scroll adjustment targets mobile layout instantly
    setTimeout(() => {
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
});

// 3. Handle row deletion
function deleteRow(buttonElement) {
    buttonElement.closest('.entry-row').remove();
}

// 4. Submit trigger logic
submitBtn.addEventListener('click', () => {
    const driverName = driverSelect.value;

    // Validation: Ensure a driver name is selected
    if (!driverName) {
        alert('Please select your name from the dropdown list.');
        driverSelect.focus();
        return;
    }

    const dateInputs = document.querySelectorAll('.date-input');
    const hoursInputs = document.querySelectorAll('.hours-input');

    // Validation Guard: Check if the user deleted all entry rows
    if (dateInputs.length === 0) {
        alert('Please add at least one shift entry before submitting.');
        return;
    }

    const shiftData = [];
    let totalHours = 0;
    let isValid = true;
    let pay = 0;
    // Compile and validate individual shift data
    dateInputs.forEach((dateInput, index) => {
        const date = dateInput.value;
        const hours = parseFloat(hoursInputs[index].value);

        if (!date || isNaN(hours)) {
            isValid = false;
            return;
        }
        
        if (hours <= 12 && hours >= 11){
            pay+=275
        } else if (hours < 11){
            pay+=hours*25
        } else if (hours > 12){
            pay+=275 + (hours-12)*25
        }


        shiftData.push({ date: date, hours: hours });
        totalHours += hours;
    });



    // console.log(hoursInputs);

    if (!isValid) {
        alert('Please check that all Date and Hours boxes are completely filled out.');
        return;
    }

    // Pack data into FormData to bypass CORS preflight restrictions
    const formData = new FormData();
    formData.append('driver', driverName);
    formData.append('submittedAt', new Date().toISOString());
    formData.append('totalHoursLogged', totalHours);
    formData.append('calculatedPay', pay);
    formData.append('shifts', JSON.stringify(shiftData)); // Sent cleanly as a stringified JSON array

    console.log('Submitting Data:', {
        driver: driverName,
        totalHours: totalHours,
        calculatedPay: pay,
        shifts: shiftData
    });

    const webhookUrl = "https://hook.us2.make.com/m22re22guu87iadbhq15pw8m1cswmpra";

    // Transmit data via Fetch API
    fetch(webhookUrl, {
        method: "POST",
        body: formData // Automatically sets correct multipart/form-data headers
    })
        .then(response => {
            if (response.ok) {
                showSuccessState();
            } else {
                alert("Submission failed to reach payroll. Check your connection.");
            }
        })
        .catch(error => {
            console.error("Network Error:", error);
            alert("A network error occurred. Please check your internet connection and try again.");
        });
});

// Helper to switch view states
function showSuccessState() {
    formContainer.classList.add('hidden');
    successContainer.classList.remove('hidden');
    window.scrollTo(0, 0);
}