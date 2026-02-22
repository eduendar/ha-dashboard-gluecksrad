const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const resultDisplay = document.getElementById('result-display');
const memberListContainer = document.getElementById('member-list');

// Data for the wheel
const allMembers = [
    { name: 'Emre', color: '#f43f5e' }, // Rose
    { name: 'Tracy', color: '#8b5cf6' }, // Violet
    { name: 'Zeyn Ali', color: '#0ea5e9' }, // Sky Blue
    { name: 'Yusha', color: '#10b981' }  // Emerald
];

let activeMembers = [...allMembers];
let currentRotation = 0; // Tracks total rotation in degrees
let isSpinning = false;
let wheelCanvasSize = 600; // Internal resolution for sharp rendering

// Initialize App
function init() {
    renderCheckboxes();
    setupCanvas();
    drawWheel();
}

function setupCanvas() {
    // Make canvas responsive but high-res internally
    const dpr = window.devicePixelRatio || 1;
    canvas.width = wheelCanvasSize * dpr;
    canvas.height = wheelCanvasSize * dpr;
    ctx.scale(dpr, dpr);
}

// Generate the sidebar checkboxes dynamically
function renderCheckboxes() {
    memberListContainer.innerHTML = '';
    allMembers.forEach((member, index) => {
        const label = document.createElement('label');
        label.className = 'member-item';
        
        // Add subtle indicator line for the member's color
        label.style.borderLeft = `4px solid ${member.color}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.dataset.index = index;
        checkbox.addEventListener('change', handleCheckboxChange);
        
        const span = document.createElement('span');
        span.className = 'member-name';
        span.textContent = member.name;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        memberListContainer.appendChild(label);
    });
}

function handleCheckboxChange() {
    if (isSpinning) {
        // Prevent changing participants while spinning
        this.checked = !this.checked; 
        return;
    }
    
    activeMembers = allMembers.filter((_, index) => {
        const checkbox = memberListContainer.querySelector(`input[data-index="${index}"]`);
        return checkbox.checked;
    });
    
    if (activeMembers.length === 0) {
        resultDisplay.textContent = 'Bitte wähle jemanden aus!';
        resultDisplay.style.color = '#f87171';
    } else {
        resultDisplay.textContent = 'Klicke das Rad zum Drehen!';
        resultDisplay.style.color = '';
        resultDisplay.classList.remove('highlight');
    }
    
    // Reset rotation when members change to redraw cleanly
    canvas.style.transition = 'none';
    currentRotation = 0;
    canvas.style.transform = `rotate(0deg)`;
    
    drawWheel();
}

function drawWheel() {
    const size = wheelCanvasSize;
    const center = size / 2;
    const radius = size / 2 - 10; // Padding
    
    ctx.clearRect(0, 0, size, size);
    
    if (activeMembers.length === 0) {
        // Empty state wheel
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 30px Outfit, sans-serif';
        ctx.fillText('Niemand ausgewählt', center, center);
        return;
    }
    
    const sliceAngle = (2 * Math.PI) / activeMembers.length;
    
    activeMembers.forEach((member, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        
        // Fill slice
        ctx.fillStyle = member.color;
        ctx.fill();
        
        // Draw separator
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0f172a'; // Match background
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px Outfit, sans-serif';
        
        // Text shadow for contrast
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(member.name, radius - 40, 0);
        ctx.restore();
    });
    
    // Center circle (the "hub")
    ctx.beginPath();
    ctx.arc(center, center, 55, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.stroke();
    
    // "SPIN" text in center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.shadowColor = 'transparent'; // Remove shadow
    ctx.fillText('SPIN', center, center);
}

// Handle clicking the wheel
canvas.addEventListener('click', spinWheel);

function spinWheel() {
    if (isSpinning || activeMembers.length === 0) return;
    
    isSpinning = true;
    resultDisplay.textContent = 'Rad dreht sich... 🎲';
    resultDisplay.classList.remove('highlight');
    resultDisplay.style.color = '';
    
    // 1. Pick a random winner
    const winnerIndex = Math.floor(Math.random() * activeMembers.length);
    const winner = activeMembers[winnerIndex];
    
    // 2. Calculate rotation math
    // In our drawing, angles start at 0 (right) and go clockwise.
    // CSS rotation also goes clockwise.
    // We want the slice's center to end up at the TOP.
    // The top of the wheel aligns with 270 degrees (-90) in canvas space.
    
    const sliceAngleDeg = 360 / activeMembers.length;
    const sliceCenterDeg = (winnerIndex * sliceAngleDeg) + (sliceAngleDeg / 2);
    
    // Target position offsets the wheel so the winner's center hits 270 degrees
    const targetRotation = 270 - sliceCenterDeg;
    
    // Add extra spins (random amount between 5 and 8 full spins) for excitement
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 4));
    
    // Calculate how much we need to add to the *current* rotation to hit the target
    const currentMod = currentRotation % 360;
    let rotationToTarget = targetRotation - currentMod;
    
    // Ensure we always spin forward by adding a full circle if negative
    if (rotationToTarget <= 0) {
        rotationToTarget += 360;
    }
    
    // Final delta = rotation to the precise target + our extra dramatic spins
    const totalDelta = rotationToTarget + extraSpins;
    
    // Optional: Add some randomness within the slice so it doesn't land perfectly center every time
    // We can offset by +/- 40% of a half slice
    const randomFrictionOffset = (Math.random() - 0.5) * (sliceAngleDeg * 0.8);
    
    currentRotation += (totalDelta + randomFrictionOffset);
    
    // 3. Apply the CSS transition
    // A nice easing curve for a heavy wheel spinning and slowing down naturally
    canvas.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.2, 1)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    
    // 4. Wait for it to stop
    setTimeout(() => {
        isSpinning = false;
        // Announce winner
        resultDisplay.innerHTML = `🎉 <strong>${winner.name}</strong> ist dran! 🎉`;
        resultDisplay.classList.add('highlight');
        
        // Add a small celebration pop
        createParticles(winner.color);
    }, 3500); // Wait same length as CSS transition
}

// Simple celebration effect
function createParticles(color) {
    const parent = document.querySelector('.wheel-wrapper');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.top = '50%';
        particle.style.left = '50%';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.background = color;
        particle.style.borderRadius = '50%';
        particle.style.zIndex = '100';
        particle.style.pointerEvents = 'none';
        
        // Random trajectory
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.transition = 'all 0.8s cubic-bezier(0.1, 0.8, 0.3, 1)';
        particle.style.transform = `translate(-50%, -50%)`;
        
        parent.appendChild(particle);
        
        // Trigger animation
        setTimeout(() => {
            particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
            particle.style.opacity = '0';
        }, 10);
        
        // Cleanup
        setTimeout(() => particle.remove(), 800);
    }
}

// Initial start
window.addEventListener('load', init);
