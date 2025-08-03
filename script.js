const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const doneBtn = document.getElementById('doneBtn');
const clearBtn = document.getElementById('clearBtn');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const formatToggle = document.getElementById('formatToggle');
const gridToggle = document.getElementById('gridToggle');
const shapeSelect = document.getElementById('shapeSelect');
const canvasSize = document.getElementById('canvasSize');
const offsetX = document.getElementById('offsetX');
const offsetY = document.getElementById('offsetY');
const offsetZ = document.getElementById('offsetZ');
const pointTool = document.getElementById('pointTool');
const lineTool = document.getElementById('lineTool');
const eraseTool = document.getElementById('eraseTool');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const outputTypeSelect = document.getElementById('outputTypeSelect');
const autoUpdate = document.getElementById('autoUpdate');

const snapToggle = document.getElementById('snapToggle');
const gridSize = document.getElementById('gridSize');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeBtn = document.querySelector('.close');

const modalSnapToggle = document.getElementById('modalSnapToggle');
const modalGridSize = document.getElementById('modalGridSize');
const modalFormatToggle = document.getElementById('modalFormatToggle');
const modalGridToggle = document.getElementById('modalGridToggle');
const modalOutputTypeSelect = document.getElementById('modalOutputTypeSelect');
const modalUpdateSelect = document.getElementById('modalUpdateToggle');

let points = [];
let currentTool = 'point';
let lineStart = null;

function setTool(tool) {
    currentTool = tool;
    pointTool.classList.toggle('active', tool === 'point');
    lineTool.classList.toggle('active', tool === 'line');
    eraseTool.classList.toggle('active', tool === 'erase');
}

function resizeCanvas(size) {
    canvas.width = size;
    canvas.height = size;
    redrawPoints();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gridToggle.checked) {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;

        const size = parseInt(gridSize.value);
        for (let x = 0; x <= canvas.width; x += size) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y += size) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
}

function redrawPoints() {
    drawGrid();
    points.forEach(point => {
        drawPoint(point.x, point.y);
    });
}

function canvasToWorld(x, y) {
    const worldX = (x - canvas.width / 2) / 50;
    const worldY = -(y - canvas.height / 2) / 50;
    return { x: worldX, y: worldY };
}

function generateOutput() {
    if (points.length === 0) {
        output.value = "No points selected!";
        copyBtn.style.display = 'none';
        return;
    }

    let cframePoints = points.map(point => {
        const worldCoord = canvasToWorld(point.x, point.y);
        const x = (worldCoord.x + parseFloat(offsetX.value)).toFixed(2);
        const y = (worldCoord.y + parseFloat(offsetY.value)).toFixed(2);
        const z = parseFloat(offsetZ.value).toFixed(2);

        const outputType = outputTypeSelect.value;
        if (outputType === 'vector3') {
            return `Vector3.new(${x}, ${y}, ${z})`;
        } else if (outputType === 'vector') {
            return `vector.create(${x}, ${y}, ${z})`;
        } else {
            return `CFrame.new(${x}, ${y}, ${z})`;
        }
    });

    if (formatToggle.checked) {
        output.value = `{${cframePoints.join(", ")}}`;
    } else {
        output.value = `{\n    ${cframePoints.join(",\n    ")}\n}`;
    }
    copyBtn.style.display = 'block';
}

function findNearestPoint(x, y) {
    const threshold = 10; // pixels
    for (let i = points.length - 1; i >= 0; i--) {
        const dx = points[i].x - x;
        const dy = points[i].y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < threshold) {
            return i;
        }
    }
    return -1;
}

function snapToGrid(x, y) {
    if (!snapToggle.checked) return { x, y };

    const size = parseInt(gridSize.value);
    const snappedX = Math.round(x / size) * size;
    const snappedY = Math.round(y / size) * size;
    return { x: snappedX, y: snappedY };
}

function pointExists(x, y) {
    const threshold = 10; // pixels
    return points.some(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < threshold;
    });
}

function generateShape(shape) {
    points = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    switch (shape) {
        case 'circle':
            for (let angle = 0; angle < 360; angle += 30) {
                const radian = angle * Math.PI / 180;
                const x = centerX + radius * Math.cos(radian);
                const y = centerY + radius * Math.sin(radian);
                points.push({ x, y });
            }
            break;

        case 'triangle':
            const trianglePoints = [
                { x: centerX, y: centerY - radius },
                { x: centerX - radius * Math.cos(30 * Math.PI / 180), y: centerY + radius * Math.sin(30 * Math.PI / 180) },
                { x: centerX + radius * Math.cos(30 * Math.PI / 180), y: centerY + radius * Math.sin(30 * Math.PI / 180) }
            ];
            points = trianglePoints;
            break;

        case 'square':
            const squarePoints = [
                { x: centerX - radius, y: centerY - radius },
                { x: centerX + radius, y: centerY - radius },
                { x: centerX + radius, y: centerY + radius },
                { x: centerX - radius, y: centerY + radius }
            ];
            points = squarePoints;
            break;

        case 'heart':
            for (let angle = 0; angle < 360; angle += 30) {
                const radian = angle * Math.PI / 180;
                const x = centerX + 16 * Math.pow(Math.sin(radian), 3) * (radius / 16);
                const y = centerY - (13 * Math.cos(radian) - 5 * Math.cos(2 * radian) - 2 * Math.cos(3 * radian) - Math.cos(4 * radian)) * (radius / 16);
                points.push({ x, y });
            }
            break;

        case 'star':
            const starPoints = 5;
            const innerRadius = radius * 0.4;
            for (let i = 0; i < starPoints * 2; i++) {
                const angle = (i * Math.PI) / starPoints;
                const r = i % 2 === 0 ? radius : innerRadius;
                const x = centerX + r * Math.sin(angle);
                const y = centerY - r * Math.cos(angle);
                points.push({ x, y });
            }
            break;
    }

    redrawPoints();
    generateOutput();
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const snapped = snapToGrid(x, y);
    x = snapped.x;
    y = snapped.y;

    if (currentTool === 'point') {
        if (!pointExists(x, y)) {
            points.push({ x, y });
            drawPoint(x, y);
        }
    } else if (currentTool === 'line') {
        if (lineStart === null) {
            lineStart = { x, y };
            drawPoint(x, y);
        } else {
            const dx = x - lineStart.x;
            const dy = y - lineStart.y;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            if (steps > 0) {
                const stepX = dx / steps;
                const stepY = dy / steps;
                for (let i = 0; i <= steps; i++) {
                    const px = lineStart.x + stepX * i;
                    const py = lineStart.y + stepY * i;
                    if (!pointExists(px, py)) {
                        points.push({ x: px, y: py });
                    }
                }
            }
            lineStart = null;
            redrawPoints();
        }
    } else if (currentTool === 'erase') {
        const index = findNearestPoint(x, y);
        if (index !== -1) {
            points.splice(index, 1);
            redrawPoints();
        }
    }
});

doneBtn.addEventListener('click', generateOutput);

clearBtn.addEventListener('click', () => {
    points = [];
    output.value = "";
    copyBtn.style.display = 'none';
    drawGrid();
    shapeSelect.value = "";
});

copyBtn.addEventListener('click', () => {
    output.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
    }, 1500);
});

formatToggle.addEventListener('change', generateOutput);
gridToggle.addEventListener('change', redrawPoints);
outputTypeSelect.addEventListener('change', generateOutput);
snapToggle.addEventListener('change', redrawPoints);
gridSize.addEventListener('change', redrawPoints);

shapeSelect.addEventListener('change', (e) => {
    generateShape(e.target.value);
});

canvasSize.addEventListener('change', (e) => {
    resizeCanvas(parseInt(e.target.value));
});

pointTool.addEventListener('click', () => setTool('point'));
lineTool.addEventListener('click', () => setTool('line'));
eraseTool.addEventListener('click', () => setTool('erase'));

[offsetX, offsetY, offsetZ].forEach(input => {
    input.addEventListener('change', generateOutput);
});

function parseCFramePoints(input) {
    try {
        input = input.replace(/^(?:local\s+points\s*=\s*)?/, '');
        const regex = /CFrame\.new\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/g;
        const matches = [...input.matchAll(regex)];

        if (matches.length === 0) {
            throw new Error('No valid CFrame points found');
        }

        return matches.map(match => {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            const z = parseFloat(match[3]);
            const canvasX = (x - parseFloat(offsetX.value)) * 50 + canvas.width / 2;
            const canvasY = canvas.height / 2 - (y - parseFloat(offsetY.value)) * 50;
            return { x: canvasX, y: canvasY };
        });
    } catch (error) {
        throw new Error('Invalid input format');
    }
}

importBtn.addEventListener('click', () => {
    try {
        const newPoints = parseCFramePoints(importInput.value);
        points = newPoints;
        redrawPoints();
        generateOutput();
        importInput.value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    syncSettings();
});

closeBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Move settings-related elements to modal
document.querySelectorAll('.toggle-container, .grid-size-container').forEach(el => {
    if (!el.closest('.modal-content')) {
        el.style.display = 'none';
    }
});

// Sync settings between main UI and modal
function syncSettings() {
    modalSnapToggle.checked = snapToggle.checked;
    modalGridSize.value = gridSize.value;
    modalFormatToggle.checked = formatToggle.checked;
    modalGridToggle.checked = gridToggle.checked;
    modalOutputTypeSelect.value = outputTypeSelect.value;
    modalUpdateSelect.value = autoUpdate.value;
}

// Add event listeners for modal controls
modalSnapToggle.addEventListener('change', (e) => {
    snapToggle.checked = e.target.checked;
    redrawPoints();
});

modalGridSize.addEventListener('change', (e) => {
    gridSize.value = e.target.value;
    redrawPoints();
});

modalFormatToggle.addEventListener('change', (e) => {
    formatToggle.checked = e.target.checked;
    if (autoUpdate.value) generateOutput();
});

modalGridToggle.addEventListener('change', (e) => {
    gridToggle.checked = e.target.checked;
    redrawPoints();
});

modalOutputTypeSelect.addEventListener('change', (e) => {
    outputTypeSelect.value = e.target.value;
    if (autoUpdate.value) generateOutput();
});

modalUpdateSelect.addEventListener('change', (e) => {
    autoUpdate.value = e.target.value;
});

drawGrid();