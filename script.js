document.getElementById('predict-btn').addEventListener('click', () => {

    const genderValue = document.getElementById('gender').value;
    const ageValue = document.getElementById('age').value.trim();
    const foodValue = document.getElementById('food').value.trim();

    if (ageValue === '' || foodValue === '') {
        alert('Please enter age and favorite food before predicting!');
        return; 
    }
    const age = parseInt(ageValue, 10);

    if (isNaN(age) || age <= 0) {
        document.getElementById('result').textContent = 'Please enter a valid age.';
        return;
    }

    const { remainingYears, baseLifespan } = predictRemainingYears(genderValue, age, foodValue.toLowerCase());
    
    const phrase = grimPhrase(remainingYears, baseLifespan);
    if (remainingYears <= 0) {
        document.getElementById('result').textContent = `${phrase} Your time is up!`;
    } else {
        document.getElementById('result').textContent = `${phrase} You have approximately ${remainingYears} years left.`;
    }

    updateManPosition(remainingYears, baseLifespan);
    performDigging(remainingYears, baseLifespan);
    // Coffin stays fixed; only the human moves into it
    moveHumanTowardCoffin(remainingYears, baseLifespan);
});

function genderBaseLifespan(gender) {
    switch (gender) {
        case 'female': return 82;
        case 'male': return 78;
        default: return 80; // other / unspecified
    }
}

function predictRemainingYears(gender, age, food) {
    let baseLifespan = genderBaseLifespan(gender);

    const goodFoods = ['salad', 'fish', 'vegetables', 'fruits', 'oats', 'apple', 'sprouts','bread','dairy'];
    const badFoods = ['pizza', 'burger', 'soda','sandwich', 'chips','chocolates', 'candy', 'ice cream','biriyani','fried rice','parotta','chicken'];

    if (goodFoods.includes(food)) {
        baseLifespan += 5;
    } else if (badFoods.includes(food)) {
        baseLifespan -= 5;
    }

    baseLifespan = Math.max(50, Math.min(95, baseLifespan));

    const remaining = baseLifespan - age;
    return { remainingYears: Math.max(0, Math.round(remaining)), baseLifespan };
}

function grimPhrase(remainingYears, baseLifespan) {
    const ratio = remainingYears / baseLifespan; // 0..1
    if (remainingYears <= 0) return '"The hourglass spent its final grain."';
    if (ratio < 0.05) return '"I have already warmed your bed of pine."';
    if (ratio < 0.15) return '"Your shadow grows short—walk softly."';
    if (ratio < 0.30) return '"The bell tolls, not far from here."';
    if (ratio < 0.50) return '"Half your candles gutter in the wind."';
    if (ratio < 0.75) return '"Waste not the embers of your day."';
    return '"The road stretches still—tread with care."';
}

// Keep shovel stationary; only toggle its state
function updateManPosition(remainingYears, baseLifespan) {
    const man = document.getElementById('man-with-shovel');
    if (!man) return;
    if (remainingYears <= 0) {
        man.classList.add('is-dead');
    } else {
        man.classList.remove('is-dead');
    }
}

function performDigging(remainingYears, baseLifespan) {
    const man = document.getElementById('man-with-shovel');
    const container = document.querySelector('.left-side');
    if (!man || !container) return;

    const scarcity = 1 - Math.min(1, Math.max(0, remainingYears / baseLifespan));
    const digs = Math.max(1, Math.round(2 + scarcity * 8));

    let i = 0;
    function oneDig() {
        man.classList.remove('dig');
        man.offsetWidth; // reflow
        man.classList.add('dig');

        const baseParticles = 6;
        const extra = Math.round(scarcity * 10);
        spawnDirtParticles(baseParticles + extra);

        i += 1;
        if (i < digs) {
            setTimeout(oneDig, 320);
        }
    }
    oneDig();
}

function spawnDirtParticles(count) {
    const man = document.getElementById('man-with-shovel');
    const container = document.querySelector('.left-side');
    if (!man || !container) return;

    const manRect = man.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // approximate shovel tip position near man's bottom-right
    const originX = manRect.left - containerRect.left + manRect.width * 0.75;
    const originY = manRect.top - containerRect.top + manRect.height * 0.85;

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'dirt';
        const size = 5 + Math.random() * 10;
        const dx = (Math.random() * 140) - 20;
        const dy = - (30 + Math.random() * 80);
        const dur = 450 + Math.random() * 650;
        p.style.setProperty('--size', `${size}px`);
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        p.style.setProperty('--dur', `${dur}ms`);
        p.style.left = `${originX}px`;
        p.style.top = `${originY}px`;
        container.appendChild(p);
        setTimeout(() => p.remove(), dur + 80);
    }
}

function moveHumanTowardCoffin(remainingYears, baseLifespan) {
    const human = document.getElementById('human');
    const coffin = document.getElementById('coffin');
    const container = document.querySelector('.left-side');
    if (!human || !coffin || !container) return;

    const ratio = Math.max(0, Math.min(1, remainingYears / baseLifespan));
    const scarcity = 1 - ratio;

    const startLeft = container.offsetWidth * 0.06;
    const coffinRect = coffin.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Anchor point near coffin center, with stronger left offset to ensure landing inside-left
    const coffinCenter = coffinRect.left - containerRect.left + coffinRect.width * 0.5;
    const overlapOffset = -coffinRect.width * 0.20; // moved further left than before
    const coffinAnchorLeft = coffinCenter + overlapOffset;

    if (ratio < 0.05 || remainingYears <= 2) {
        human.classList.add('inside');
        human.style.left = `${coffinAnchorLeft}px`;
        return;
    }

    human.classList.remove('inside');

    const progress = Math.min(1, scarcity);
    const newLeft = startLeft + (coffinAnchorLeft - startLeft) * progress;
    human.style.left = `${newLeft}px`;
}
