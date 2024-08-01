document.addEventListener('DOMContentLoaded', function() {
    d3.csv("https://raw.githubusercontent.com/JayGupta797/olympics/main/assets/output.csv").then(function(data) {
        const educationData = d3.group(data, d => d.education || "None");
        const medalTableRows = d3.select("#medal-table-rows");

        // Calculate totals for each education and store them in an array
        const educationTotalsArray = [];
        educationData.forEach((athletes, education) => {
            const educationKey = education.replace(/[^a-zA-Z0-9]/g, '_');
            const educationTotals = athletes.reduce((totals, athlete) => {
                totals.gold += +athlete.medals_gold;
                totals.silver += +athlete.medals_silver;
                totals.bronze += +athlete.medals_bronze;
                return totals;
            }, { gold: 0, silver: 0, bronze: 0 });

            educationTotals.total = educationTotals.gold + educationTotals.silver + educationTotals.bronze;
            educationTotalsArray.push({ education, educationKey, totals: educationTotals, athletes });
        });

        // Sort the array by total medals
        educationTotalsArray.sort((a, b) => b.totals.total - a.totals.total);

        // Create rows for each education group
        educationTotalsArray.forEach((educationData, index) => {
            const { education, educationKey, totals, athletes } = educationData;

            // Sort athletes within each education group by total medals
            athletes.sort((a, b) =>
                (+b.medals_gold + +b.medals_silver + +b.medals_bronze) -
                (+a.medals_gold + +a.medals_silver + +a.medals_bronze)
            );

            // Assign educationKey and athleteIndex to each athlete for easier matching
            athletes.forEach((athlete, athleteIndex) => {
                athlete.educationKey = educationKey;
                athlete.athleteIndex = athleteIndex;
            });

            const row = medalTableRows.append("div").attr("class", "medal-table-row");

            row.html(`
                <div class="medal-order">${index + 1}</div>
                <div>${education}</div>
                <div class="medal-count">${totals.gold}</div>
                <div class="medal-count">${totals.silver}</div>
                <div class="medal-count">${totals.bronze}</div>
                <div class="medal-count">${totals.total}</div>
                <button onclick="toggleEducationDetails('${educationKey}')"><img src="./assets/expand.svg" alt="Expand" class="expand-icon"></button>
            `);

            medalTableRows.append("div").attr("class", "education-details-container").attr("id", `education-details-${educationKey}`);

            athletes.forEach((athlete, athleteIndex) => {
                const athleteRow = d3.select(`#education-details-${educationKey}`).append("div").attr("class", "medal-table-row medal-table-sub-row");

                athleteRow.html(`
                    <div class="medal-order">${athleteIndex + 1}</div>
                    <div>${athlete.first_name} ${athlete.last_name}</div>
                    <div class="medal-count">${athlete.medals_gold}</div>
                    <div class="medal-count">${athlete.medals_silver}</div>
                    <div class="medal-count">${athlete.medals_bronze}</div>
                    <div class="medal-count">${+athlete.medals_gold + +athlete.medals_silver + +athlete.medals_bronze}</div>
                    <button onclick="toggleAthleteDetails('${educationKey}', ${athleteIndex})"><img src="./assets/expand.svg" alt="Expand" class="expand-icon"></button>
                `);

                d3.select(`#education-details-${educationKey}`).append("div").attr("class", "athlete-details-container").attr("id", `athlete-details-${educationKey}-${athleteIndex}`);
            });
        });
        window.athleteData = data;
    });
});

function toggleEducationDetails(educationKey) {
    const detailsDiv = document.getElementById(`education-details-${educationKey}`);
    const isVisible = detailsDiv.style.display === "block";
    detailsDiv.style.display = isVisible ? "none" : "block";
    updateToggleButton(detailsDiv.previousElementSibling.querySelector('button'), isVisible);
}

function toggleAthleteDetails(educationKey, index) {
    const detailsDiv = document.getElementById(`athlete-details-${educationKey}-${index}`);
    const isVisible = detailsDiv.style.display === "block";
    detailsDiv.style.display = isVisible ? "none" : "block";
    updateToggleButton(detailsDiv.previousElementSibling.querySelector('button'), isVisible);
    if (!isVisible) loadAthleteData(educationKey, index, detailsDiv);
}

function updateToggleButton(button, isVisible) {
    button.innerHTML = `<img src="./assets/${isVisible ? 'expand' : 'collapse'}.svg" alt="${isVisible ? 'Expand' : 'Collapse'}" class="expand-icon">`;
    button.classList.toggle('black-background', !isVisible);
}

function loadAthleteData(educationKey, index, container) {
    const athlete = window.athleteData.find(a => a.educationKey === educationKey && a.athleteIndex === index);
    container.innerHTML = `
        <div class="athlete-details">
            <div class="athlete-photo">
                <img src="${athlete.thumbnail_url}" alt="${athlete.thumbnail_alt_text}" class="athlete-image">
            </div>
            <div class="athlete-info">
                <h2>${athlete.first_name} ${athlete.last_name}</h2>
                <hr>
                <p><strong>Height:</strong> ${athlete.height}</p>
                <p><strong>Age:</strong> ${athlete.age}</p>
                <p><strong>Hometown:</strong> ${athlete.hometown_city}, ${athlete.hometown_state}</p>
                <p><strong>Sport:</strong> ${athlete.sport}</p>
            </div>
        </div>
    `;
}