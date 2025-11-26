// 🚀 OVDJE STAVI SVOJ BACKEND URL SA RENDERA
const API_BASE = "https://backend-ojru.onrender.com"; // <-- PROMIJENI

// Kreiraj IntersectionObserver
document.addEventListener("DOMContentLoaded", function () {
    const targetDivs = document.querySelectorAll('.desnastranaslika, .lijevastranaslika');

    if (targetDivs.length === 0) {
        console.warn("⚠️ Nema elemenata za animaciju. Provjeri klase u HTML-u.");
        return;
    }

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px'
    });

    targetDivs.forEach(div => observer.observe(div));

    const hasExpiryCheckbox = document.getElementById('has_expiry');
    if (hasExpiryCheckbox) {
        hasExpiryCheckbox.addEventListener('change', function () {
            const expirySection = document.getElementById('expiry_section');
            const expiresDate = document.getElementById('expires_date');
            const expiresTime = document.getElementById('expires_time');

            const show = this.checked;
            expirySection.style.display = show ? 'block' : 'none';
            expiresDate.required = show;
            expiresTime.required = show;
        });
    }
});

// Funkcija koja puni tabelu
function populateTable(rows) {
    const table = document.getElementById('raspored-tabela');
    table.innerHTML = '';

    const titleRow = table.insertRow();
    const titleCell = titleRow.insertCell();
    titleCell.colSpan = 6;
    titleCell.innerHTML = '<h1>RASPORED TRENINGA</h1>';
    titleCell.style.textAlign = 'center';

    const headerRow = table.insertRow();
    const days = ['PONEDJELJAK', 'UTORAK', 'SRIJEDA', 'CETVRTAK', 'PETAK', 'SUBOTA'];
    days.forEach(day => {
        let cell = headerRow.insertCell();
        cell.innerHTML = `<h2>${day}</h2>`;
    });

    rows.forEach(row => {
        const tableRow = table.insertRow();

        [
            ['ponedjeljak', 'ponedjeljak_time'],
            ['utorak', 'utorak_time'],
            ['srijeda', 'srijeda_time'],
            ['cetvrtak', 'cetvrtak_time'],
            ['petak', 'petak_time'],
            ['subota', 'subota_time']
        ].forEach(([day, time]) => {
            let nameCell = tableRow.insertCell();

            const name = row[day] || '';
            const timeValue = row[time] || '';

            nameCell.innerHTML = `<h3>${name}</h3>${timeValue ? `<p>${timeValue}</p>` : ''}`;
        });
    });
}

// Dohvatanje rasporeda
document.addEventListener("DOMContentLoaded", () => {
    function fetchTableData() {
        fetch(`${API_BASE}/getRaspored`)
            .then(response => response.json())
            .then(data => {
                if (data && data.rows) {
                    populateTable(data.rows);
                } else {
                    console.log('Nema podataka');
                }
            })
            .catch(error => {
                console.error('Greška pri dohvaćanju podataka:', error);
            });
    }

    fetchTableData();
});

// Otvoriti modal za editovanje rasporeda
function openModaltabela() {
    document.getElementById('modaltabela').style.display = "flex";
    populateEditForm();
}

function closeModaltebela() {
    document.getElementById('modaltabela').style.display = "none";
}

// Popunjavanje forme sa podacima iz tabele
function populateEditForm() {
    const tableRows = document.querySelectorAll("#raspored-tabela tr");
    const formTable = document.querySelector(".edit-tabela");
    formTable.innerHTML = "";
    const addedRows = [];

    tableRows.forEach((row, index) => {
        if (index > 1) {
            const cells = row.querySelectorAll("td");
            const newRow = formTable.insertRow();

            let rowContent = "";
            let isDuplicate = false;

            cells.forEach((cell, cellIndex) => {
                const nameElement = cell.querySelector("h3");
                const timeElement = cell.querySelector("p");

                const nameText = nameElement ? nameElement.innerText.trim() : "";
                const timeText = timeElement ? timeElement.innerText.trim() : "";

                const nameTimeInputWrapper = document.createElement("div");

                const nameInput = document.createElement("input");
                nameInput.type = "text";
                nameInput.value = nameText;
                nameInput.name = [
                    'ponedjeljak', 'utorak', 'srijeda',
                    'cetvrtak', 'petak', 'subota'
                ][cellIndex];

                const timeInput = document.createElement("input");
                timeInput.type = "text";
                timeInput.value = timeText;
                timeInput.name = [
                    'ponedjeljak_time', 'utorak_time', 'srijeda_time',
                    'cetvrtak_time', 'petak_time', 'subota_time'
                ][cellIndex];

                nameTimeInputWrapper.appendChild(nameInput);
                nameTimeInputWrapper.appendChild(timeInput);

                const newCell = newRow.insertCell();
                newCell.appendChild(nameTimeInputWrapper);

                rowContent += nameText + " " + timeText + " ";
            });

            if (addedRows.includes(rowContent.trim())) {
                isDuplicate = true;
            }

            if (!isDuplicate) {
                addedRows.push(rowContent.trim());
            } else {
                formTable.deleteRow(formTable.rows.length - 1);
            }
        }
    });
}

function saveTableData(event) {
    event.preventDefault();
    const formRows = document.querySelectorAll(".edit-tabela tr");
    const updatedData = [];

    formRows.forEach(row => {
        const nameInputs = row.querySelectorAll("input");
        const rowData = {
            ponedjeljak: nameInputs[0].value,
            ponedjeljak_time: nameInputs[1].value,
            utorak: nameInputs[2].value,
            utorak_time: nameInputs[3].value,
            srijeda: nameInputs[4].value,
            srijeda_time: nameInputs[5].value,
            cetvrtak: nameInputs[6].value,
            cetvrtak_time: nameInputs[7].value,
            petak: nameInputs[8].value,
            petak_time: nameInputs[9].value,
            subota: nameInputs[10].value,
            subota_time: nameInputs[11].value
        };
        updatedData.push(rowData);
    });

    fetch(`${API_BASE}/updateRaspored`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ rows: updatedData })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTableFromServer();
                closeModaltebela();
            } else {
                alert("Došlo je do greške pri čuvanju podataka.");
            }
        })
        .catch(error => console.error("Greška pri slanju podataka:", error));
}

document.getElementById("edit-form").onsubmit = saveTableData;

function updateTableFromServer() {
    fetch(`${API_BASE}/getRaspored`)
        .then(response => response.json())
        .then(data => {
            if (data && data.rows) {
                populateTable(data.rows);
            } else {
                console.log('Nema podataka');
            }
        })
        .catch(error => {
            console.error('Greška pri dohvaćanju podataka:', error);
        });
}

// Slider telefon
let trenutniTrenerSlidetelefon = 0;
const treneriSlidertelefon = document.getElementById("treneri-slidertelefon");
const trenerSlidestelefon = document.querySelectorAll(".treneri-slidetelefon");
const ukupnoTrenerSlidestelefon = trenerSlidestelefon.length;
const trenerDotstelefon = document.querySelectorAll(".trener-dottelefon");

function promijeniTrenerSlidetelefon(index) {
    trenutniTrenerSlidetelefon = index;
    azurirajTrenerSlidertelefon();
}

function azurirajTrenerSlidertelefon() {
    treneriSlidertelefon.style.transform = `translateX(-${trenutniTrenerSlidetelefon * 100}%)`;
    trenerDotstelefon.forEach((dot, i) => {
        dot.classList.toggle("aktivan", i === trenutniTrenerSlidetelefon);
    });
}

function autoTrenerSlidetelefon() {
    if (window.innerWidth <= 768) {
        trenutniTrenerSlidetelefon = (trenutniTrenerSlidetelefon + 1) % ukupnoTrenerSlidestelefon;
        azurirajTrenerSlidertelefon();
    }
}

function automatskiPomerajtelefon() {
    setInterval(autoTrenerSlidetelefon, 5000);
}

window.addEventListener('load', automatskiPomerajtelefon);

trenerDotstelefon.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        promijeniTrenerSlidetelefon(index);
    });
});

// Login, token i modal login
function openLoginWindow() {
    window.open("login.html", "LoginWindow", "width=400,height=300");
}

function checkLoginStatus() {
    let korisnik = localStorage.getItem("korisnik");
    if (korisnik) {
        document.getElementById("loginText").innerHTML = "Dobrodošao, " + korisnik + "!";
        document.getElementById("otvori-modal").style.display = "block";
        document.getElementById("logout").style.display = "block";
        document.getElementById("edit-btn").style.display = "block";
    }
}

function logout() {
    localStorage.removeItem("korisnik");
    localStorage.removeItem("token");
    location.reload();
}

window.onload = function () {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-edit").style.display = "none";
};

setInterval(checkLoginStatus, 1000);

function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Unesite korisničko ime i lozinku!");
        return;
    }

    fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                localStorage.setItem("korisnik", username);
                localStorage.setItem("token", data.token);
                window.close();
                location.reload();
            } else {
                alert("Pogrešno korisničko ime ili lozinka!");
            }
        });
}

// Slider desktop
let trenutniTrenerSlide = 0;
const treneriSlider = document.getElementById("treneri-slider");
const trenerSlides = document.querySelectorAll(".treneri-slide");
const trenerDots = document.querySelectorAll(".trener-dot");
const ukupnoTrenerSlides = trenerSlides.length;
let trenerTimer = null;

function azurirajTrenerSlider() {
    treneriSlider.style.transform = `translateX(-${trenutniTrenerSlide * 100}%)`;
    trenerDots.forEach((dot, i) => {
        dot.classList.toggle("aktivan", i === trenutniTrenerSlide);
    });
}

function promijeniTrenerSlide(index) {
    trenutniTrenerSlide = index;
    azurirajTrenerSlider();
    restartujAutomatskiPomeraj();
}

function autoTrenerSlide() {
    trenutniTrenerSlide = (trenutniTrenerSlide + 1) % ukupnoTrenerSlides;
    azurirajTrenerSlider();
}

function pokreniAutomatskiPomeraj() {
    trenerTimer = setInterval(autoTrenerSlide, 5000);
}

function restartujAutomatskiPomeraj() {
    clearInterval(trenerTimer);
    pokreniAutomatskiPomeraj();
}

window.addEventListener('load', function () {
    pokreniAutomatskiPomeraj();
});

trenerDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        promijeniTrenerSlide(index);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    dohvatiNovosti();
});

function prikaziPanel() {
    document.getElementById("novosti-panel").style.display = "block";
}

function sakrijPanel() {
    document.getElementById("novosti-panel").style.display = "none";
}

// Dodavanje novosti
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("modal-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const naslov = document.getElementById("naslov").value;
        const opis = document.getElementById("opis").value;
        const short = document.getElementById("short").value;
        const slika = document.getElementById("slika").files[0];
        const expires_date = document.getElementById("expires_date").value;
        const expires_time = document.getElementById("expires_time").value;
        const isPinned = document.getElementById("is_pinned").checked;

        if (!naslov || !opis || !short || !slika) {
            alert("Svi podaci moraju biti popunjeni!");
            return;
        }

        const expires_at = `${expires_date}T${expires_time}:00.000Z`;

        const formData = new FormData();
        formData.append("title", naslov);
        formData.append("content", opis);
        formData.append("short", short);
        formData.append("slika", slika);
        formData.append("expires_at", expires_at);
        formData.append("is_pinned", isPinned);

        fetch(`${API_BASE}/add-news`, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    alert("Novost je uspješno dodana!");
                    dohvatiNovosti();
                    document.getElementById("modal").style.display = "none";
                } else {
                    alert(`Došlo je do greške: ${data.message}`);
                }
            })
            .catch(error => {
                console.error("Greška pri slanju podataka:", error);
            });
    });
});

function zatvoriFormu() {
    document.getElementById('novost-form').reset();
    console.log("Forma je zatvorena");
}

function dohvatiNovosti() {
    let screenWidth = window.innerWidth;
    let limit = screenWidth < 768 ? 3 : 6;
    let korisnik = localStorage.getItem("korisnik");

    fetch(`${API_BASE}/get-news?page=${trenutnaStranica}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            let novostiLista = document.getElementById("novosti-lista");
            novostiLista.innerHTML = "";
            novostiLista.classList.add("news-container");

            if (data.novosti && data.novosti.length > 0) {
                data.novosti.sort((a, b) => {
                    return (b.is_pinned === true) - (a.is_pinned === true);
                });
                data.novosti.forEach(novost => {
                    let novostDiv = document.createElement("div");
                    novostDiv.classList.add("news-item");
                    novostDiv.setAttribute("data-id", novost.id);
                    novostDiv.setAttribute("data-content", encodeURIComponent(novost.content));
                    novostDiv.setAttribute("data-expires-at", novost.expires_at);
                    novostDiv.setAttribute("data-ispinned", novost.ispinned ? "1" : "0");

                    let naslovEl = document.createElement("h2");
                    naslovEl.classList.add("naslov");
                    naslovEl.innerText = novost.title;

                    let slikaEl = document.createElement("img");
                    slikaEl.src = `${API_BASE}/${novost.image_path}`;
                    if (screenWidth < 768) {
                        slikaEl.style.width = "100%";
                        slikaEl.style.height = "auto";
                    } else {
                        slikaEl.style.width = "300px";
                        slikaEl.style.height = "auto";
                        slikaEl.style.border = "2px solid yellow";
                        slikaEl.style.borderRadius = "15px";
                    }

                    let kraciOpisEl = document.createElement("p");
                    kraciOpisEl.classList.add("short");
                    kraciOpisEl.innerText = novost.short;

                    let datumObjavljen = new Date(novost.created_at);
                    let dan = datumObjavljen.getDate().toString().padStart(2, '0');
                    let mesec = (datumObjavljen.getMonth() + 1).toString().padStart(2, '0');
                    let godina = datumObjavljen.getFullYear();
                    let sati = datumObjavljen.getHours().toString().padStart(2, '0');
                    let minuti = datumObjavljen.getMinutes().toString().padStart(2, '0');

                    if (novost.ispinned) {
                        let pinnedLabel = document.createElement("div");
                        pinnedLabel.classList.add("pinned-label");
                        pinnedLabel.innerText = "📌";
                        novostDiv.appendChild(pinnedLabel);
                    }

                    let dugmeEdit = document.createElement("button");
                    dugmeEdit.innerText = "Edituj";
                    dugmeEdit.onclick = function () {
                        editujNovostModaledit(novost.id);
                    };

                    let dugmeObrisi = document.createElement("button");
                    dugmeObrisi.innerText = "Obriši";
                    dugmeObrisi.onclick = function () {
                        obrisiNovost(novost.id);
                    };

                    let dugmeSaznaj = document.createElement("button");
                    dugmeSaznaj.innerText = "Saznaj više";
                    dugmeSaznaj.onclick = function () {
                        prikaziPrikazNovosti(novost);
                    };

                    if (korisnik) {
                        novostDiv.appendChild(dugmeEdit);
                        novostDiv.appendChild(dugmeObrisi);
                    }
                    novostDiv.appendChild(naslovEl);
                    novostDiv.appendChild(slikaEl);
                    novostDiv.appendChild(kraciOpisEl);
                    novostDiv.appendChild(dugmeSaznaj);

                    let datumEl = document.createElement("p");
                    datumEl.classList.add("datum");
                    datumEl.innerText = `Objavljeno: ${dan}.${mesec}.${godina} u ${sati}:${minuti}`;
                    novostDiv.appendChild(datumEl);

                    if (novost.expires_at && !novost.isExpired) {
                        let countdownEl = document.createElement("p");
                        countdownEl.classList.add("expires-in");
                        let expiresIn = novost.expires_in;

                        function updateTimer() {
                            if (expiresIn > 0) {
                                expiresIn -= 1000;
                                let seconds = Math.floor((expiresIn % (1000 * 60)) / 1000);
                                let minutes = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));
                                let hours = Math.floor((expiresIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                let days = Math.floor(expiresIn / (1000 * 60 * 60 * 24));

                                countdownEl.innerText = `Ističe za ${days}d ${hours}h ${minutes}m ${seconds}s`;
                            } else {
                                countdownEl.innerText = "Ističe za 0d 0h 0m 0s";
                                obrisiNovostbezprovjere(novost.id);
                                novostDiv.remove();
                            }
                        }

                        updateTimer();
                        setInterval(updateTimer, 1000);
                        novostDiv.appendChild(countdownEl);
                    } else if (novost.isExpired) {
                        obrisiNovostbezprovjere(novost.id);
                        novostDiv.remove();
                    }

                    novostiLista.appendChild(novostDiv);
                });
            } else {
                novostiLista.innerHTML = "Nema novosti za prikaz.";
            }

            ukupnoStranica = data.totalPages;
            document.getElementById('total-pages').textContent = ukupnoStranica;
            document.getElementById('page-number').textContent = trenutnaStranica;

            document.getElementById('prev').disabled = trenutnaStranica === 1;
            document.getElementById('next').disabled = trenutnaStranica === ukupnoStranica;
        });
}

function prikaziCelokupanOpis(celokupanOpis) {
    let modal = document.getElementById("modal-full-description");
    let fullDescriptionText = document.getElementById("full-description-text");
    fullDescriptionText.innerText = celokupanOpis;
    modal.style.display = "block";
}

function editujNovostModaledit(id) {
    console.log(`Editovanje novosti sa ID: ${id}`);

    let novostDiv = document.querySelector(`[data-id='${id}']`);
    if (!novostDiv) {
        console.error("Novost sa ID: " + id + " nije pronađena!");
        return;
    }

    let naslovEl = novostDiv.querySelector(".naslov");
    let shortEl = novostDiv.querySelector(".short");
    let content = decodeURIComponent(novostDiv.getAttribute("data-content"));
    let expiresAt = novostDiv.getAttribute("data-expires-at");
    let isPinned = novostDiv.getAttribute("data-ispinned") === "1";

    document.getElementById("naslovzaedit").value = naslovEl ? naslovEl.innerText : '';
    document.getElementById("opiszaedit").value = content || '';
    document.getElementById("shortzaedit").value = shortEl ? shortEl.innerText : '';

    if (expiresAt && expiresAt !== 'null' && expiresAt !== '') {
        const expiresDate = new Date(expiresAt);
        if (!isNaN(expiresDate.getTime())) {
            document.getElementById("expires_date_edit").value = expiresDate.toISOString().split('T')[0];
            document.getElementById("expires_time_edit").value = expiresDate.toTimeString().split(' ')[0];
            document.getElementById('has_expiry_edit').checked = true;
            document.getElementById("expiry_section_edit").style.display = 'block';
        } else {
            document.getElementById("expires_date_edit").value = '';
            document.getElementById("expires_time_edit").value = '';
            document.getElementById('has_expiry_edit').checked = false;
            document.getElementById("expiry_section_edit").style.display = 'none';
        }
    } else {
        document.getElementById("expires_date_edit").value = '';
        document.getElementById("expires_time_edit").value = '';
        document.getElementById('has_expiry_edit').checked = false;
        document.getElementById("expiry_section_edit").style.display = 'none';
    }

    document.getElementById("edit_is_pinned").checked = isPinned;
    console.log(isPinned);
    document.getElementById("modal-edit-form").setAttribute("data-id", id);
    document.getElementById("modal-edit").style.display = "flex";
}

document.getElementById('has_expiry_edit').addEventListener('change', toggleExpirySection);

function toggleExpirySection() {
    const expirySection = document.getElementById('expiry_section_edit');
    const dateInput = document.getElementById('expires_date_edit');
    const timeInput = document.getElementById('expires_time_edit');
    const checkbox = document.getElementById('has_expiry_edit');

    if (checkbox.checked) {
        expirySection.style.display = 'block';
        dateInput.required = true;
        timeInput.required = true;
    } else {
        expirySection.style.display = 'none';
        dateInput.required = false;
        timeInput.required = false;
        dateInput.value = '';
        timeInput.value = '';
    }
}

function sacuvajIzmenemodaledit() {
    let naslov = document.getElementById("naslovzaedit").value;
    let short = document.getElementById("shortzaedit").value;
    let opis = document.getElementById("opiszaedit").value;
    let slikaInput = document.getElementById("slikazaedit");
    let slika = slikaInput.files[0];

    let expiresDate = document.getElementById("expires_date_edit").value;
    let expiresTime = document.getElementById("expires_time_edit").value;
    let hasExpiry = document.getElementById("has_expiry_edit").checked;

    let isPinned = document.getElementById("edit_is_pinned").checked ? 1 : 0;

    // expires_at
    let expiresAt = "";
    if (hasExpiry) {
        if (!expiresDate || !expiresTime) {
            alert("Ako uključiš datum isteka, moraš unijeti i datum i vrijeme!");
            return;
        }
        expiresAt = `${expiresDate}T${expiresTime}:00.000Z`;
    }

    if (!naslov || !short || !opis) {
        alert("Svi podaci moraju biti popunjeni!");
        return;
    }

    let formData = new FormData();
    formData.append("id", document.getElementById("modal-edit-form").getAttribute("data-id"));
    formData.append("naslov", naslov);
    formData.append("short", short);
    formData.append("opis", opis);
    formData.append("is_pinned", isPinned);
    formData.append("expires_at", expiresAt);

    // 👇 samo ako je stvarno izabrana nova slika
    if (slika) {
        formData.append("slika", slika);
    }

    fetch(`${API_BASE}/edit-news`, {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        console.log("Odgovor sa servera:", data);
        if (data.status === "success") {
            alert("Novost je uspješno sačuvana.");
            zatvoriModalmodaledit();
        } else {
            alert("Došlo je do greške pri čuvanju novosti.");
        }
    })
    .catch(err => console.error("Greška pri slanju podataka:", err));
}


function zatvoriModalmodaledit() {
    document.getElementById("modal-edit").style.display = "none";
    location.reload();
}

document.getElementById("modal-edit-form").addEventListener("submit", function (event) {
    let fileInput = document.getElementById("novaslika");
    let hiddenSlikaInput = document.getElementById("stara-slika");

    if (!fileInput.files.length) {
        fileInput.value = hiddenSlikaInput.value;
    }
});

function obrisiNovost(id) {
    if (confirm("Da li ste sigurni da želite da obrišete ovu novost?")) {
        fetch(`${API_BASE}/delete-news/${id}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Greška pri brisanju novosti');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    alert("Novost je uspješno obrisana.");
                    dohvatiNovosti();
                } else {
                    alert("Greška prilikom brisanja novosti.");
                }
            })
            .catch(error => {
                console.error("Greška:", error);
                alert("Došlo je do greške pri brisanju novosti.");
            });
    }
}

function obrisiNovostbezprovjere(id) {
    fetch(`${API_BASE}/delete-news/${id}`, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Greška pri brisanju novosti');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                dohvatiNovosti();
            }
        });
}

function otvoriFormu() {
    document.getElementById("nova-novost-forma").style.display = "block";
}

function zatvoriFormuNova() {
    document.getElementById("nova-novost-forma").style.display = "none";
}

// Broj objava
function getNewsCount() {
    fetch(`${API_BASE}/get-news-count`)
        .then(response => response.json())
        .then(data => {
            const totalNews = data.total;
            if (totalNews > 0) {
                document.getElementById('novosti-count').textContent = `Ukupno objava: ${totalNews}`;
            }
        });
}



document.getElementById("otvori-modal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "flex";
});

document.querySelector(".zatvori").addEventListener("click", function () {
    document.getElementById("modal").style.display = "none";
});

window.onclick = function (event) {
    let modal = document.getElementById("modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

function prikaziPrikazNovosti(novost) {
    console.log("Prikazujemo novost:", novost);

    let modalNaslov = document.getElementById("modalPrikazNovostiNaslov");
    let modalSlika = document.getElementById("modalPrikazNovostiSlika");
    let modalOpis = document.getElementById("modalPrikazNovostiOpis");

    modalNaslov.innerText = novost.title;
    modalOpis.innerText = novost.content;

    if (novost.image_path) {
        modalSlika.src = `${API_BASE}/${novost.image_path}`;
        modalSlika.style.display = "block";
    } else {
        modalSlika.style.display = "none";
    }

    document.getElementById("modalPrikazNovosti").style.display = "flex";
}

function zatvoriModalPrikazNovosti() {
    let modal = document.getElementById("modalPrikazNovosti");
    if (modal) {
        modal.style.display = "none";
        console.log("Modal zatvoren!");
    }
}

let trenutnaStranica = 1;
let ukupnoStranica = 1;

document.getElementById('prev').addEventListener('click', () => {
    if (trenutnaStranica > 1) {
        trenutnaStranica--;
        dohvatiNovosti();
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (trenutnaStranica < ukupnoStranica) {
        trenutnaStranica++;
        dohvatiNovosti();
    }
});

function toggleMenu() {
    const menu = document.querySelector('.mobile-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';

    if (menu.style.display === 'flex') {
        document.addEventListener("click", closeMenuOutside);
    } else {
        document.removeEventListener("click", closeMenuOutside);
    }
}

function closeMenuOutside(event) {
    const menu = document.querySelector('.mobile-menu');
    const hamburger = document.querySelector('.hamburger');

    if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
        menu.style.display = 'none';
        document.removeEventListener("click", closeMenuOutside);
    }
}

let trenutniIndex = 0;
const slike = document.querySelectorAll(".prikaz");
const dugmad = document.querySelectorAll(".slider-nav a");
let autoSlide = setInterval(promeniNaSledecu, 4000);

function promeniSliku(index) {
    resetujSlike();
    trenutniIndex = index;
    slike[trenutniIndex].classList.add("aktivna");
    dugmad[trenutniIndex].classList.add("aktivna");

    clearInterval(autoSlide);
    autoSlide = setInterval(promeniNaSledecu, 4000);
}

function promeniNaSledecu() {
    let sledeciIndex = (trenutniIndex + 1) % slike.length;
    promeniSliku(sledeciIndex);
}

function resetujSlike() {
    slike.forEach(slika => slika.classList.remove("aktivna"));
    dugmad.forEach(dugme => dugme.classList.remove("aktivna"));
}

promeniSliku(0);



