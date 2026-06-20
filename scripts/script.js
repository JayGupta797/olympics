document.addEventListener('DOMContentLoaded', function() {
    d3.csv("./2024-olympics-medals.csv").then(function(data) {
        data = data.filter(d => d.education && d.education.trim());
        const educationData = d3.group(data, d => d.education);
        const medalTableRows = d3.select("#medal-table-rows");

        // Calculate totals for each education group and store them in an array
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

            // Append a row for each education group
            const row = medalTableRows.append("div").attr("class", "medal-table-row");

            row.html(`
                <div class="col-rank"><span class="medal-order">${index + 1}</span></div>
                <div class="col-name">${education}</div>
                <div class="col-medal">${totals.gold}</div>
                <div class="col-medal">${totals.silver}</div>
                <div class="col-medal">${totals.bronze}</div>
                <div class="col-medal">${totals.total}</div>
                <button class="col-action" onclick="toggleEducationDetails('${educationKey}')">
                    <img src="./assets/expand.svg" alt="Expand" class="expand-icon">
                </button>
            `);

            // Append a container for each education group's details
            medalTableRows.append("div")
                .attr("class", "education-details-container")
                .attr("id", `education-details-${educationKey}`);

            // Append a row for each athlete within the education group
            athletes.forEach((athlete, athleteIndex) => {
                const athleteEntry = d3.select(`#education-details-${educationKey}`).append("div")
                    .attr("class", "athlete-entry");

                const athleteRow = athleteEntry.append("div")
                    .attr("class", "medal-table-row medal-table-sub-row");

                athleteRow.html(`
                    <div class="col-rank"><span class="medal-order sub">${athleteIndex + 1}</span></div>
                    <div class="col-name">${athlete.first_name} ${athlete.last_name}</div>
                    <div class="col-medal">${athlete.medals_gold}</div>
                    <div class="col-medal">${athlete.medals_silver}</div>
                    <div class="col-medal">${athlete.medals_bronze}</div>
                    <div class="col-medal">${+athlete.medals_gold + +athlete.medals_silver + +athlete.medals_bronze}</div>
                    <button class="col-action" onclick="toggleAthleteDetails('${educationKey}', ${athleteIndex})">
                        <img src="./assets/expand.svg" alt="Expand" class="expand-icon">
                    </button>
                `);

                athleteEntry.append("div")
                    .attr("class", "athlete-details-container")
                    .attr("id", `athlete-details-${educationKey}-${athleteIndex}`);
            });
        });

        // Store athlete data globally
        window.athleteData = data;
    });
});

/**
 * Toggles the visibility of education group details.
 * @param {string} educationKey - The unique key identifying the education group.
 */
function toggleEducationDetails(educationKey) {
    const detailsDiv = document.getElementById(`education-details-${educationKey}`);
    const isVisible = detailsDiv.style.display === "block";
    detailsDiv.style.display = isVisible ? "none" : "block";
    const button = detailsDiv.previousElementSibling.querySelector('button');
    updateToggleButton(button, isVisible);
    button.blur();
}

function toggleAthleteDetails(educationKey, index) {
    const detailsDiv = document.getElementById(`athlete-details-${educationKey}-${index}`);
    const isVisible = detailsDiv.style.display === "grid";
    detailsDiv.style.display = isVisible ? "none" : "grid";
    detailsDiv.closest('.athlete-entry').classList.toggle('is-expanded', !isVisible);
    const button = detailsDiv.previousElementSibling.querySelector('button');
    updateToggleButton(button, isVisible);
    button.blur();
    if (!isVisible) loadAthleteData(educationKey, index, detailsDiv);
}

/**
 * Updates the expand/collapse button icon.
 * @param {HTMLButtonElement} button - The button element to update.
 * @param {boolean} isVisible - Whether the details are currently visible.
 */
function updateToggleButton(button, isVisible) {
    button.innerHTML = `<img src="./assets/${isVisible ? 'expand' : 'collapse'}.svg" alt="${isVisible ? 'Expand' : 'Collapse'}" class="expand-icon">`;
}

/**
 * Loads and displays athlete data within the details container.
 * @param {string} educationKey - The unique key identifying the education group.
 * @param {number} index - The index of the athlete within the education group.
 * @param {HTMLElement} container - The container to populate with athlete data.
 */
function loadAthleteData(educationKey, index, container) {
    const athlete = window.athleteData.find(a => a.educationKey === educationKey && a.athleteIndex === index);
    container.innerHTML = `
        <div class="athlete-details">
            <div class="athlete-photo-wrap">
                <img src="${athlete.thumbnail_url}" alt="${athlete.thumbnail_alt_text}" class="athlete-photo">
            </div>
            <div class="athlete-info">
                <h2 class="athlete-name">${athlete.first_name} ${athlete.last_name}</h2>
                <hr>
                <p><strong>Height:</strong> ${athlete.height}</p>
                <p><strong>Age:</strong> ${athlete.age}</p>
                <p><strong>Home:</strong> ${athlete.hometown_city}, ${athlete.hometown_state}</p>
                <p><strong>Sport:</strong> ${athlete.sport}</p>
            </div>
        </div>
    `;

    const syncPhotoSize = () => {
        const info = container.querySelector('.athlete-info');
        const wrap = container.querySelector('.athlete-photo-wrap');
        if (info && wrap && info.offsetHeight > 0) {
            wrap.style.width = `${info.offsetHeight}px`;
        }
    };

    requestAnimationFrame(syncPhotoSize);
    container.querySelector('.athlete-photo').addEventListener('load', syncPhotoSize);
}