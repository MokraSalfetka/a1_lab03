const map = L.map('map').setView([52.237049, 21.017532], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

document.getElementById('locateButton').addEventListener('click', function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 13);
                L.marker([lat, lng]).addTo(map)
                    .bindPopup("Twoja lokalizacja")
                    .openPopup();
            },
            function (error) {
                sendNotification("Blad", "Nie można pobrać lokalizacji.");
                console.error(error);
            }
        );
    } else {
        sendNotification("Blad", "Geolokalizacja nie jest wspierana przez tę przeglądarkę.");
    }
});

document.getElementById('downloadMapButton').addEventListener('click', function () {
    leafletImage(map, function (err, canvas) {
        if (err) {
            console.error("Błąd podczas pobierania mapy:", err);
            sendNotification("Blad", "Nie udalo sie pobrac obrazu mapy.");
            return;
        }

        openModalWithCanvas(canvas);

        generatePuzzle(canvas);
    });
});

function openModalWithCanvas(canvas) {
    const modal = document.getElementById("modal");
    const closeButton = document.querySelector(".close-button");

    const previewContainer = document.getElementById("canvasPreviewContainer");
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);

    modal.style.display = "block";

    closeButton.onclick = function() 
    {
        modal.style.display = "none";
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
        }
    };
}

function generatePuzzle(canvas) {
    const piecesContainer = document.getElementById('pieces');
    piecesContainer.innerHTML = '';

    const pieceSize = 100;
    const rows = 4;
    const cols = 4;

    let positions = Array.from(Array(rows * cols).keys());
    shuffleArray(positions);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const position = positions.pop();
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
            piece.style.backgroundPosition = `-${(position % cols) * pieceSize}px -${Math.floor(position / cols) * pieceSize}px`;
            piece.draggable = true;
            piece.dataset.correctPosition = position;

            piece.addEventListener('dragstart', dragStart);
            piecesContainer.appendChild(piece);
        }
    }

}

function dragStart(event) {
    event.dataTransfer.setData('text', event.target.dataset.correctPosition);
}

document.querySelectorAll('.board-cell').forEach(cell => {
    cell.addEventListener('dragover', event => event.preventDefault());
    cell.addEventListener('drop', drop);
});

function drop(event) {
    const correctPosition = event.dataTransfer.getData('text');
    const piece = document.querySelector(`.piece[data-correct-position="${correctPosition}"]`);

    if (event.target.dataset.position === correctPosition) {
        event.target.appendChild(piece);
        piece.draggable = false;
        piece.style.cursor = 'default';
    }

    if (document.querySelectorAll('.board-cell > .piece').length === 16)
    {
        sendNotification('Gratulacje!', 'Ulozyles mapee.');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body });
            }
        });
    }
}